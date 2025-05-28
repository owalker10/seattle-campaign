import { style } from '@vanilla-extract/css';
export const rowHover = style({});

export const gripIcon = style({
  opacity: 0,
  transition: 'all .2s',
  selectors: {
    [`${rowHover}:hover &`]: {
      opacity: 1,
    },
  },
});
