import * as Font from 'expo-font';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  Poppins_400Regular_Italic,
} from '@expo-google-fonts/poppins';

/**
 * Font configuration for the Live Music Finder app
 * Uses Poppins family from Google Fonts
 */

export const FONT_FAMILY = {
  // Primary font: Poppins (Google Fonts)
  poppinsLight: 'Poppins_300Light',
  poppinsRegular: 'Poppins_400Regular',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemiBold: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
  poppinsExtraBold: 'Poppins_800ExtraBold',
  poppinsBlack: 'Poppins_900Black',
  poppinsRegularItalic: 'Poppins_400Regular_Italic',
};

export const FONT_WEIGHTS = {
  light: FONT_FAMILY.poppinsLight,
  regular: FONT_FAMILY.poppinsRegular,
  medium: FONT_FAMILY.poppinsMedium,
  semiBold: FONT_FAMILY.poppinsSemiBold,
  bold: FONT_FAMILY.poppinsBold,
  extraBold: FONT_FAMILY.poppinsExtraBold,
  black: FONT_FAMILY.poppinsBlack,
  italic: FONT_FAMILY.poppinsRegularItalic,
};

/**
 * Load all Poppins fonts from Google Fonts
 * Call this function in your App component's useEffect hook
 */
export async function loadCustomFonts() {
  try {
    await Font.loadAsync({
      [FONT_FAMILY.poppinsLight]: Poppins_300Light,
      [FONT_FAMILY.poppinsRegular]: Poppins_400Regular,
      [FONT_FAMILY.poppinsMedium]: Poppins_500Medium,
      [FONT_FAMILY.poppinsSemiBold]: Poppins_600SemiBold,
      [FONT_FAMILY.poppinsBold]: Poppins_700Bold,
      [FONT_FAMILY.poppinsExtraBold]: Poppins_800ExtraBold,
      [FONT_FAMILY.poppinsBlack]: Poppins_900Black,
      [FONT_FAMILY.poppinsRegularItalic]: Poppins_400Regular_Italic,
    });
    console.log('[Fonts] Poppins fonts loaded successfully');
    return true;
  } catch (error) {
    console.error('[Fonts] Error loading Poppins fonts:', error);
    return false;
  }
}
