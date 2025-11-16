/**
 * @screen CitySelectionScreen
 * @description One-time city selection screen shown after first login. Beautiful cards with photos of Kelowna and Nelson.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Animated, Easing, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemeMode } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../utils/fontConfig';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { CityCard } from '../components/CityCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export const CitySelectionScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground, glassmorphic } = useTheme();
  const { themeMode } = useThemeMode();
  const { setSelectedCity } = useUserPreferences();
  
  const [selectedCity, setLocalSelectedCity] = useState<'Kelowna' | 'Nelson' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCitySelect = (city: 'Kelowna' | 'Nelson') => {
    setLocalSelectedCity(city);
  };

  const handleConfirm = async () => {
    if (!selectedCity) return;
    
    setIsConfirming(true);
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Save city selection (this will trigger navigation via RootNavigator)
      setSelectedCity(selectedCity);
    });
  };

  const isDark = themeMode === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View 
        style={{ 
          flex: 1, 
          backgroundColor: '#0A0A0A',
          paddingHorizontal: 24,
          paddingTop: 50,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 48, alignItems: 'center' }}>
          <View
            style={{ 
              width: 72, 
              height: 72, 
              borderRadius: 36, 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 24,
              backgroundColor: '#f2a41e',
            }}
          >
            <MapPin size={36} color="#fff" strokeWidth={2} />
          </View>

          <Text 
            style={{ 
              fontSize: 32, 
              fontWeight: '700', 
              color: text,
              textAlign: 'center',
              marginBottom: 12,
              fontFamily: FONT_FAMILY.poppinsBold,
               marginTop: -15,

            }}
          >
            Choose Your City
          </Text>
          <Text 
            style={{ 
              fontSize: 16, 
              color: textMuted,
              textAlign: 'center',
              lineHeight: 24,
              paddingHorizontal: 20,
              fontFamily: FONT_FAMILY.poppinsRegular,
            }}
          >
            Select your location to discover live music events in your area
          </Text>
        </View>

        {/* City Cards */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 20, marginBottom: 40 }}>
          {/* Kelowna Card */}
          <CityCard
            city="Kelowna"
            imageUrl={require("../../assets/images/kelowna.jpg")}
            description="Heart of the Okanagan’s Live Music Scene"
            isSelected={selectedCity === 'Kelowna'}
            onSelect={() => handleCitySelect('Kelowna')}
            primary={primary}
            text={text}
            textMuted={textMuted}
            cardBackground={cardBackground}
            isDark={isDark}
          />

          {/* Nelson Card */}
          <CityCard
            city="Nelson"
            imageUrl={require("../../assets/images/Nelson.jpg")}
            description="Kootenay’s Eclectic Music Hub"
            isSelected={selectedCity === 'Nelson'}
            onSelect={() => handleCitySelect('Nelson')}
            primary={primary}
            text={text}
            textMuted={textMuted}
            cardBackground={cardBackground}
            isDark={isDark}
          />
        </View>

        {/* Confirm Button */}
        {selectedCity && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Pressable
              onPress={handleConfirm}
              disabled={isConfirming}
              style={({ pressed }) => ({
                opacity: pressed || isConfirming ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  backgroundColor: '#f2a41e',
                }}
              >
                <Check size={20} color="#fff" strokeWidth={3} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: FONT_FAMILY.poppinsSemiBold }}>
                  {isConfirming ? 'Confirming...' : `Continue with ${selectedCity}`}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

interface CityCardProps {
  city: string;
  imageUrl: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  primary: string;
  text: string;
  textMuted: string;
  cardBackground: string;
  isDark: boolean;
}



export default CitySelectionScreen;