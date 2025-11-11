import * as Font from 'expo-font';

/**
 * Font configuration for the Live Music Finder app
 * Uses Proxima Nova family with various weights
 */

export const FONT_FAMILY = {
  // Primary font: Proxima Nova
  proximaNova: 'proximanova-regular',
  proximaNovaLight: 'proximanova-light',
  proximaNovaMedium: 'proximanova-mediumit', // Italic medium
  proximaNovaSemiBold: 'proximanova-semibold',
  proximaNovaBold: 'proximanova-bold',
  proximanovaExtraBold: 'proximanova-extrabold',
  proximanovaBlack: 'proximanova-black',
};

export const FONT_WEIGHTS = {
  light: FONT_FAMILY.proximaNovaLight,
  regular: FONT_FAMILY.proximaNova,
  medium: FONT_FAMILY.proximaNovaMedium,
  semiBold: FONT_FAMILY.proximaNovaSemiBold,
  bold: FONT_FAMILY.proximaNovaBold,
  extraBold: FONT_FAMILY.proximanovaExtraBold,
  black: FONT_FAMILY.proximanovaBlack,
};

/**
 * Load all custom fonts
 * Call this function in your App component's useEffect hook
 */
export async function loadCustomFonts() {
  try {
    await Font.loadAsync({
      [FONT_FAMILY.proximaNova]: require('../../assets/fonts/proximanova-regular.otf'),
      [FONT_FAMILY.proximaNovaLight]: require('../../assets/fonts/proximanova-light.otf'),
      [FONT_FAMILY.proximaNovaMedium]: require('../../assets/fonts/proximanova-mediumit.otf'),
      [FONT_FAMILY.proximaNovaSemiBold]: require('../../assets/fonts/proximanova-semibold.otf'),
      [FONT_FAMILY.proximaNovaBold]: require('../../assets/fonts/proximanova-bold.otf'),
      [FONT_FAMILY.proximanovaExtraBold]: require('../../assets/fonts/proximanova-extrabold.otf'),
      [FONT_FAMILY.proximanovaBlack]: require('../../assets/fonts/proximanova-black.otf'),
    });
    console.log('[Fonts] Custom fonts loaded successfully');
    return true;
  } catch (error) {
    console.error('[Fonts] Error loading custom fonts:', error);
    return false;
  }
}
