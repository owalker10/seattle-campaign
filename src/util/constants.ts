export const STATS = ['brains', 'brawn', 'charm', 'fight', 'flight', 'grit'] as const;
export const DICE = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4'] as const;

export const CHARACTERS: Record<string, string> = {
  olympia: 'Riley',
  ryan: 'Willy',
  chris: 'Red',
  sophia: 'Mars',
  grant: 'Tony',
  claire: 'Jamie',
};
if (import.meta.env.DEV) {
  CHARACTERS['test'] = 'Jane Doe';
}

export const STAT_DESCRIPTIONS = {
  brains: {
    description: 'How book-smart a character is.',
    example: 'Figuring out a device or technology.',
    magic: 'Divination.',
  },
  brawn: {
    description: 'How much brute strength a character has.',
    example: 'Lifting or carrying something heavy.',
    magic: 'Levitation, protection (of objects), disablement.',
  },
  charm: {
    description: ' How good with people a character is.',
    example: 'Smooth-talking a guard.',
    magic: 'Enchantment, illusion.',
  },
  fight: {
    description: 'How good a character is at combat and using weapons.',
    example: 'Shooting a gun.',
    magic: 'Offensive, curse-breaking.',
  },
  flight: {
    description: 'How quick and evasive a character is.',
    example: 'Dodging an attack.',
    magic: 'Stealth, movement, deflection.',
  },
  grit: {
    description: 'How resilient and street-smart a character is.',
    example: 'Staying up all night.',
    magic: 'Protection (of people), healing.',
  },
};
