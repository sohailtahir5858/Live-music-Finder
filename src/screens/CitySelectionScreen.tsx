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
import { useUserPreferences } from '../stores/userPreferencesStore';

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
          paddingTop: 40,
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
            imageUrl="https://trymagically.com/api/media/image?query=kelowna%20bc%20canada%20city%20beautiful%20okanagan%20lake%20sunset"
            description="Okanagan's vibrant music scene"
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
            imageUrl="https://trymagically.com/api/media/image?query=nelson%20bc%20canada%20city%20mountains%20kootenay%20lake"
            description="Kootenay's eclectic music hub"
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
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
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

const CityCard: React.FC<CityCardProps> = ({
  city,
  imageUrl,
  description,
  isSelected,
  onSelect,
  primary,
  text,
  textMuted,
  cardBackground,
  isDark,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: isSelected ? 3 : 0,
          borderColor: isSelected ? primary : 'transparent',
        }}
      >
        <View style={{ height: 220, width: CARD_WIDTH, position: 'relative' }}>
          {/* Background Image */}
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
            resizeMode="cover"
          />

          {/* Dark Gradient Overlay */}
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />

          {/* Glassmorphic Content */}
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                padding: 16,
              }}
            >
              <View 
                style={{ 
                  backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text 
                      style={{ 
                        fontSize: 24, 
                        fontWeight: '700', 
                        color: '#fff',
                        marginBottom: 4,
                      }}
                    >
                      {city}
                    </Text>
                    <Text 
                      style={{ 
                        fontSize: 14, 
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={18} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default CitySelectionScreen;