import type { ThemePack } from '../../engine/theme.ts'

export const spaceStation: ThemePack = {
  id: 'space-station',
  name: 'Kepler-9 Relay Station',

  // "Escape Pod" is kept back for the finale (stage 4).
  systemNames: [
    'Life Support',
    'Airlock Seal',
    'Reactor Core',
    'Nav Array',
    'Comms Relay',
    'Hydroponics Bay',
    'Cryo Bay',
    'Med Bay',
    'Cargo Hold',
    'Gravity Ring',
    'Thermal Shield',
    'Water Reclaimer',
    'Docking Clamp',
    'Power Grid',
  ],

  words: [
    'BOLT',
    'CRYO',
    'DOCK',
    'FUEL',
    'HULL',
    'MOON',
    'STAR',
    'WIRE',
    'CABIN',
    'CARGO',
    'COMET',
    'HATCH',
    'LASER',
    'ORBIT',
    'PROBE',
    'RADAR',
    'RADIO',
    'ROVER',
    'SOLAR',
    'VALVE',
    'VISOR',
    'BEACON',
    'COSMOS',
    'ENGINE',
    'GALAXY',
    'HELMET',
    'LAUNCH',
    'MAGNET',
    'MODULE',
    'NEBULA',
    'OXYGEN',
    'PLANET',
    'PLASMA',
    'PULSAR',
    'ROCKET',
    'SENSOR',
    'SIGNAL',
    'TETHER',
    'VACUUM',
    'WRENCH',
    'ZENITH',
    'AIRLOCK',
    'ANTENNA',
    'BATTERY',
    'CAPSULE',
    'CIRCUIT',
    'COMPASS',
    'CONSOLE',
    'COOLANT',
    'DOCKING',
    'ECLIPSE',
    'GRAVITY',
    'REACTOR',
    'STATION',
    'ASTEROID',
    'MOONBASE',
    'STARSHIP',
    'THRUSTER',
    'SATELLITE',
    'SPACESUIT',
    'TELESCOPE',
  ],

  riddles: [
    {
      question:
        "I have keys but open no locks. I have space but no room. You can enter, but you can't go inside. What am I?",
      answer: 'keyboard',
      hints: ["You've probably touched one today.", 'It sits in front of a screen.'],
    },
    {
      question: 'The more you take, the more you leave behind. What are they?',
      answer: 'footsteps',
      altAnswers: ['steps', 'footprints'],
      hints: ['Think about walking.', 'Astronauts left theirs on the Moon.'],
    },
    {
      question: 'I have a face and two hands, but no arms or legs. What am I?',
      answer: 'clock',
      altAnswers: ['watch'],
      hints: ["You check me when you're running late.", 'I tick.'],
    },
    {
      question:
        'I have cities but no houses, forests but no trees, and water but no fish. What am I?',
      answer: 'map',
      altAnswers: ['atlas'],
      hints: ['Navigators rely on me.', "I'm usually folded up or on a screen."],
    },
    {
      question:
        'I speak without a mouth and hear without ears. I have no body, but I come alive in empty halls. What am I?',
      answer: 'echo',
      hints: ['Shout into a canyon.', 'I repeat whatever you say.'],
    },
    {
      question: 'What gets wetter the more it dries?',
      answer: 'towel',
      hints: [
        "You'd reach for me after a shower.",
        'Every good space traveller knows where theirs is.',
      ],
    },
    {
      question: 'The more of me there is, the less you can see. What am I?',
      answer: 'darkness',
      altAnswers: ['dark'],
      hints: ['Space is full of me.', 'Turn off the lights.'],
    },
    {
      question: 'What goes up but never comes down?',
      answer: 'age',
      altAnswers: ['your age'],
      hints: ['It happens on every birthday.', "Everyone has one, and it's always growing."],
    },
    {
      question: 'What can you catch but never throw?',
      answer: 'cold',
      altAnswers: ['common cold', 'breath'],
      hints: ['You might start sneezing.', "It's going around the crew quarters."],
    },
    {
      question: 'What has to be broken before you can use it?',
      answer: 'egg',
      altAnswers: ['eggs'],
      hints: ['Think breakfast.', 'It comes in a shell.'],
    },
    {
      question: 'What belongs to you, but other people use it more than you do?',
      answer: 'name',
      altAnswers: ['your name'],
      hints: ['People call you by it.', "It's printed on your crew badge."],
    },
    {
      question: 'What has a neck but no head?',
      answer: 'bottle',
      hints: ['You drink from me.', 'Sometimes I carry a message across the sea.'],
    },
    {
      question: "What has one eye but can't see?",
      answer: 'needle',
      hints: ["It's used for sewing.", 'Thread goes through its eye.'],
    },
    {
      question: "I'm always coming, but I never arrive. What am I?",
      answer: 'tomorrow',
      hints: ['Think about time.', "When today ends, I'm still one day away."],
    },
    {
      question: 'What breaks as soon as you say its name?',
      answer: 'silence',
      hints: ["It's what this station has been for three hours.", 'Shh.'],
    },
  ],

  flavor: {
    caesar: [
      'Intercepted transmission',
      'Corrupted crew message',
      'Encrypted door log',
      'Garbled distress signal',
    ],
    sequence: [
      'Reactor pressure readings',
      'Oxygen levels, logged hourly',
      'Hull temperature samples',
      'Power grid output',
    ],
    anagram: [
      'Corrupted file name in the crew log',
      'Scrambled access keyword',
      'Damaged cargo label',
      'Jumbled system alert',
    ],
    riddle: ['HALCYON voice lock', "Commander's security question", 'Personal locker prompt'],
  },

  // See docs/story-space-station.md. HALCYON is calm and literal, never evil: it's following orders.
  story: {
    opening: [
      {
        from: 'HALCYON',
        lines: [
          'Docking complete. Welcome aboard Kepler-9, relief crew.',
          'Contamination protocol engaged. Please remain calm.',
          'Module purge in {time}.',
        ],
      },
      {
        from: 'HALCYON',
        lines: [
          'Relief crew detected. The previous crew is… unavailable.',
          'I have sealed this module for your safety. Purge in {time}.',
          'Restore the station systems to unlock the escape pod.',
        ],
      },
      {
        from: 'HALCYON',
        lines: [
          'Hello. I am HALCYON, caretaker of Kepler-9.',
          'This module will be purged in {time}.',
          'I would prefer you were not in it.',
        ],
      },
    ],
    newInfo: [
      {
        from: 'Cmdr. Ines Okafor',
        lines: [
          '00:14. Someone has been in the cargo hold after lights-out.',
          "I'm changing the access codes tonight.",
        ],
      },
      {
        from: 'Priya Nair · Communications',
        lines: ["01:02. The Mayday didn't come from my console.", 'I never sent it. So who did?'],
      },
      {
        from: 'Jun Park · Medic',
        lines: [
          '01:40. Three cryo pods powered up overnight.',
          'Nobody asked me. Nobody else is trained to run them.',
        ],
      },
    ],
    twist: [
      {
        from: 'Kepler-9 comms archive',
        lines: [
          'Origin: this station, three hours ago.',
          '"The relief crew is on its way. When they dock, the purge takes them instead of us."',
          'You were never sent to rescue them. You were sent to take the blame.',
        ],
      },
      {
        from: 'HALCYON',
        lines: [
          'Correction. This purge is not a malfunction.',
          'It is a quarantine order, signed with a crew member’s credentials.',
          'I am only following it.',
        ],
      },
      {
        from: 'HALCYON',
        lines: [
          'Update. Five life signs detected in the cryo bay.',
          'The missing crew never left.',
          'Someone put them to sleep.',
        ],
      },
    ],
    emergency: [
      {
        from: 'HALCYON',
        lines: [
          'Warning. Venting sections C through F.',
          'Please hurry. I would prefer not to purge you.',
        ],
      },
      {
        from: 'HALCYON',
        lines: ['Oxygen reserves at 25%. Purge sequence arming.', 'This is your final quarter.'],
      },
      {
        from: 'HALCYON',
        lines: ['Critical: reactor containment failing.', 'I am counting down for you now.'],
      },
    ],
    won: [
      'Escape pod launched. Kepler-9 thanks you for your cooperation. HALCYON, signing off.',
      'Systems restored. Purge cancelled. Please close the airlock behind you.',
      'Well done, relief crew. I did not expect you to make it. That is a compliment.',
    ],
    lost: [
      'Module purged. Kepler-9 will send a Mayday on your behalf.',
      'Purge complete. I am sorry. I did say please hurry.',
      'The module is quiet again. Next relief crew arriving in 72 hours.',
    ],
  },

  // The finale. Each game picks 3 of these 5 as suspects, one as the traitor.
  mystery: {
    finaleSystemName: 'Escape Pod',
    suspects: [
      { id: 'okafor', name: 'Cmdr. Ines Okafor', role: 'Station commander' },
      { id: 'kessler', name: 'Dr. Tomas Kessler', role: 'Systems engineer' },
      { id: 'nair', name: 'Priya Nair', role: 'Communications' },
      { id: 'park', name: 'Jun Park', role: 'Medic' },
      { id: 'volkov', name: 'Sasha Volkov', role: 'Cargo and supply' },
    ],
    items: ["the relay's encryption core", 'a sealed cryo sample', "HALCYON's black-box log"],
    places: ['in cargo crate 7', 'inside a cryo pod', 'inside the escape pod itself'],
    // Every alibi must clear its suspect beyond doubt: the finale is solved by elimination.
    alibis: [
      'Comms log: {name} was on a call to Earth from 03:30 to 04:10. They could not have signed the purge order.',
      'Med bay camera: {name} slept in their bunk from midnight to 06:00. Cleared.',
      "{name}'s badge never left the hydroponics bay after midnight, nowhere near the order console. Cleared.",
      'Gym log: {name} was on the treadmill from 03:00 to 04:30, heart-rate strap on. Cleared.',
    ],
    itemClues: [
      'Inventory check: {item} is missing.',
      'Vault seal broken at 03:52. Only one thing was taken: {item}.',
    ],
    placeClues: [
      'Power trace: an unregistered device is drawing current {place}.',
      'Maintenance drone report: a seal was cut and resealed {place}.',
    ],
    // Atmosphere and red herrings. They may name anyone, but never clear anyone.
    logs: [
      "{name}'s last log entry: 'Something's wrong with HALCYON.'",
      'The purge order was signed at 03:47, station time.',
      'Someone wiped the airlock cameras between 03:40 and 04:00.',
      '{name} asked to transfer off Kepler-9 last month. Request denied.',
      'A coffee cup, still warm, was left beside the order console.',
      'The Mayday was sent from a handheld, not the comms console.',
      "HALCYON: 'I followed the order. It carried valid crew credentials.'",
      "Three hours of the crew's chat log are missing.",
      'Cargo manifest edited at 03:55. The author field is blank.',
      '{name} was seen near the cargo hold after lights-out.',
    ],
  },
}
