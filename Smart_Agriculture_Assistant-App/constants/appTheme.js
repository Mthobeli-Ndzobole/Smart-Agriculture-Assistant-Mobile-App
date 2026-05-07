import { Platform } from 'react-native';

const webShadow = {
  boxShadow: '0px 4px 12px rgba(16, 28, 20, 0.10)',
};

const nativeShadow = {
  elevation: 4,
  shadowColor: '#101C14',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
};

export const theme = {
  colors: {
    bg: '#F3F7F0',
    card: '#FFFFFF',
    primary: '#1E7A4B',
    primaryDark: '#145A36',
    secondary: '#C0E8D5',
    text: '#173022',
    mutedText: '#5F6E63',
    warning: '#EAAA32',
    danger: '#D64545',
    info: '#2C7BE5',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
  },
  shadow: Platform.OS === 'web' ? webShadow : nativeShadow,
};
