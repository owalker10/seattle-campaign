import { ConfigProvider, Slider, SliderSingleProps, theme } from 'antd';
import * as React from 'react';

const { useToken } = theme;

const GRADIENT = 'linear-gradient(90deg, #727272 0%, #53715E 48.81%, #2EBA62 100%)';
const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = (value) =>
  `${Math.abs(value ?? 0)}`;

/** A slider to track AIMG in integers from 3 (gray) to 3 (green). The rail is a gradient from grey to green, and the thumb should have the same color as the part of the rail it's on. */
export function AIMG({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const { token } = useToken();
  const [currentValue, setValue] = React.useState(value);
  const [changing, setChanging] = React.useState(false);
  const activeValue = changing ? currentValue : value;
  const handleColor = React.useMemo(
    () => getColorAtPercent(parseLinearGradient(GRADIENT), ((activeValue + 3) / 6) * 100),
    [activeValue]
  );
  const handleChange = React.useCallback(
    (n: number) => {
      setChanging(true);
      setValue(n);
    },
    [setChanging, setValue]
  );
  const handleChangeComplete = React.useCallback(
    (n: number) => {
      setChanging(false);
      onChange(n);
    },
    [setChanging, onChange]
  );
  const marks = React.useMemo(
    () =>
      Object.fromEntries(
        [-3, -2, -1, 0, 1, 2, 3].map((n) => [
          n,
          {
            style: { color: token.colorTextSecondary, fontSize: 12 },
            label: Math.abs(n),
          },
        ])
      ),
    [token]
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: handleColor,
        },
        components: {
          Slider: {
            railSize: 8,
            handleSize: 12,
            handleColor: handleColor,
            handleActiveColor: handleColor,
            handleLineWidth: 4,
            handleLineWidthHover: 5,
            handleColorDisabled: handleColor,
            dotActiveBorderColor: '#00000080',
          },
        },
      }}
    >
      <Slider
        id="aimg"
        value={activeValue}
        onChange={handleChange}
        onChangeComplete={handleChangeComplete}
        disabled={disabled}
        min={-3}
        max={3}
        marks={marks}
        step={1}
        tooltip={{ formatter }}
        style={{ filter: disabled ? 'brightness(0.8) saturate(0.9)' : undefined }}
        styles={{
          track: { display: 'none' },
          rail: {
            background: GRADIENT,
            borderRadius: 4,
            width: `calc(100% + 8px)`,
            marginLeft: '-4px',
          },
        }}
      />
    </ConfigProvider>
  );
}

// utility functions to parse color at % of gradient

type Gradient = {
  color: string;
  position: number;
}[];

function hexToRgb(hex: string) {
  const parsed = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return parsed ? parsed.slice(1).map((x) => parseInt(x, 16)) : null;
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateColor(color1: string, color2: string, t: number) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) {
    return '#000000';
  }
  const result = rgb1.map((c, i) => Math.round(lerp(c, rgb2[i], t)));
  if (result.length < 3) {
    return '#000000';
  }
  return rgbToHex(result as [number, number, number]);
}

function getColorAtPercent(gradientStops: Gradient, p: number) {
  if (p <= gradientStops[0].position) return gradientStops[0].color;
  if (p >= gradientStops[gradientStops.length - 1].position)
    return gradientStops[gradientStops.length - 1].color;

  for (let i = 0; i < gradientStops.length - 1; i++) {
    const start = gradientStops[i];
    const end = gradientStops[i + 1];

    if (p >= start.position && p <= end.position) {
      const t = (p - start.position) / (end.position - start.position);
      return interpolateColor(start.color, end.color, t);
    }
  }
  return undefined;
}

function parseLinearGradient(cssString: string): Gradient {
  // Remove "linear-gradient(" and the closing ")"
  const content = cssString
    .trim()
    .replace(/^linear-gradient\(/i, '')
    .replace(/\)$/, '');

  const parts = content.split(/,(?![^(]*\))/).map((part) => part.trim());

  // Optional: skip direction (first part) if it's an angle or to-side
  const hasDirection = /^(\d+deg|to\b)/i.test(parts[0]);
  const stops = hasDirection ? parts.slice(1) : parts;

  return stops.map((stop) => {
    const match = stop.match(/(#(?:[a-f\d]{3}){1,2}|rgba?\([^)]+\))\s+([\d.]+)%/i);
    if (match) {
      const [, color, position] = match;
      return {
        color,
        position: parseFloat(position),
      };
    } else {
      // fallback: if no position is given, assume it's evenly spaced (not fully spec-compliant)
      return { color: stop, position: NaN };
    }
  });
}
