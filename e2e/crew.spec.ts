import { expect, test, type Page } from '@playwright/test'
import { openEverySystem, systems } from './room.ts'

/**
 * Two browsers, one crew. Everything here is a real game: two anonymous logins against the auth
 * emulator, one shared room in Firestore, and the same screens a player uses.
 */

async function host(page: Page, name: string, shift: 'Quick Run' | 'Deep Space') {
  await page.goto('/')
  // The radio itself is screen-reader-only; players tap the label around it.
  await page.getByText(shift, { exact: true }).click()
  await page.getByRole('button', { name: 'Host a crew' }).click()
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: 'Create crew' }).click()
  // Hosting takes you to /c/CODE, which is also the link you share.
  await page.waitForURL(/\/c\/[A-Z2-9]{5}$/)
  return page.url().split('/c/')[1]!
}

async function join(page: Page, code: string, name: string) {
  await page.goto(`/c/${code}`)
  await page.getByRole('textbox').fill(name)
  const joinButton = page.getByRole('button', { name: 'Join crew' })
  // Joining needs an anonymous sign-in first. A tap that lands before it is ready does nothing,
  // so retry exactly as a player would rather than failing the run.
  await expect(async () => {
    if (await joinButton.isVisible()) await joinButton.click()
    await expect(page.getByText('(you)')).toBeVisible({ timeout: 5_000 })
  }).toPass({ timeout: 30_000 })
}

/** Story transmissions cover the board until they're dismissed. */
async function dismissTransmission(page: Page) {
  const continueButton = page.getByRole('button', { name: 'Continue' })
  if (await continueButton.isVisible()) await continueButton.click()
}

async function openSystem(page: Page, name: string) {
  await dismissTransmission(page)
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click()
}

test('a crew hosts, joins, plays together and sees each other', async ({ browser }) => {
  const ana = await browser.newPage()
  const ben = await browser.newPage()

  const code = await host(ana, 'Ana', 'Quick Run')
  expect(code).toMatch(/^[A-Z2-9]{5}$/)

  await join(ben, code, 'Ben')
  // Each player appears in the other's lobby.
  await expect(ana.getByText('Crew · 2/6')).toBeVisible()
  await expect(ana.getByText('Ben', { exact: true })).toBeVisible()
  await expect(ben.getByText('Ana', { exact: true })).toBeVisible()
  // Only the host can launch.
  await expect(ben.getByRole('button', { name: /^Launch/ })).toHaveCount(0)

  await ana.getByRole('button', { name: /^Launch/ }).click()

  // Both phones land in the same game, with the same systems.
  for (const page of [ana, ben]) {
    await expect(page.getByRole('heading', { name: /Station systems/ })).toBeVisible()
  }
  const board = await systems(code)
  await expect(ana.getByRole('button', { name: new RegExp(`^${board[0]!.name}`) })).toBeVisible()
  await expect(ben.getByRole('button', { name: new RegExp(`^${board[0]!.name}`) })).toBeVisible()

  // Ben solves a system: Ana's screen updates without a reload, and says who did it.
  const first = board[0]!
  await openSystem(ben, first.name)
  await ben.getByRole('textbox', { name: 'Your answer' }).fill(first.answer)
  await ben.getByRole('button', { name: 'Submit' }).click()
  await expect(ben.getByText(`✓ ${first.name} restored`)).toBeVisible()
  await expect(ana.getByText(`Ben restored ${first.name}`)).toBeVisible()

  await ana.close()
  await ben.close()
})

test('a split puzzle puts one piece on each screen', async ({ browser }) => {
  const ana = await browser.newPage()
  const ben = await browser.newPage()

  // Deep Space has 12 systems, so it always has split ones.
  const code = await host(ana, 'Ana', 'Deep Space')
  await join(ben, code, 'Ben')
  await ana.getByRole('button', { name: /^Launch/ }).click()
  await expect(ben.getByRole('heading', { name: /Station systems/ })).toBeVisible()

  await openEverySystem(code)
  const split = (await systems(code)).find((system) => system.split)!
  expect(split, 'a Deep Space crew game should have split systems').toBeTruthy()

  await openSystem(ana, split.name)
  await openSystem(ben, split.name)

  // Both see the banner, and each holds a piece the other doesn't.
  for (const page of [ana, ben]) {
    await expect(page.getByText('Split system')).toBeVisible()
    await expect(page.getByText('Only on your screen')).toBeVisible()
  }
  await expect(ana.getByText('On Ben’s screen. Ask them what it shows.')).toBeVisible()
  await expect(ben.getByText('On Ana’s screen. Ask them what it shows.')).toBeVisible()

  // Anyone can answer once the crew has pooled what they see.
  await ana.getByRole('textbox', { name: 'Your answer' }).fill(split.answer)
  await ana.getByRole('button', { name: 'Submit' }).click()
  await expect(ana.getByText(`✓ ${split.name} restored`)).toBeVisible()
  await expect(ben.getByText(`✓ ${split.name} restored`)).toBeVisible()

  await ana.close()
  await ben.close()
})
