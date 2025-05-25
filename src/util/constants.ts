export const STATS = ['brains', 'brawn', 'charm', 'fight', 'flight', 'grit'] as const;
export const DICE = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4'] as const;

export const CHARACTERS: Record<string, string> = {
  olympia: 'Riley',
  ryan: 'Willy',
  chris: 'Red',
  sophia: 'Mars',
  grant: 'Tony',
  claire: 'JJ',
};
if (import.meta.env.DEV) {
  CHARACTERS['test'] = 'Jane Doe';
}
