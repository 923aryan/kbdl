import { Platform } from 'react-native';

const PRIMARY = '#0658C2';
const NAVY = '#01122E';
const BORDER = '#D3D3D3';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#676767';

export const Colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    surface: '#F9FAFB',

    // Brand
    primary: PRIMARY,
    tint: PRIMARY,

    // Text
    text: TEXT_PRIMARY,
    textSecondary: TEXT_SECONDARY,

    // Icons
    icon: TEXT_SECONDARY,
    tabIconDefault: TEXT_SECONDARY,
    tabIconSelected: '#FFFFFF',

    // UI
    border: BORDER,
    card: '#FFFFFF',
  },

  dark: {
    // Backgrounds
    background: NAVY,
    surface: '#0A1A3A',

    // Brand
    primary: PRIMARY,
    tint: PRIMARY,

    // Text
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',

    // Icons
    icon: '#A1A1AA',
    tabIconDefault: '#A1A1AA',
    tabIconSelected: '#FFFFFF',

    // UI
    border: '#2A2A2A',
    card: '#111827',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
