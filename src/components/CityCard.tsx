import React from 'react';
import { View, Text, Pressable, Animated, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check } from 'lucide-react-native';
import { FONT_FAMILY } from '../utils/fontConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface CityCardProps {
  city: string;
  imageUrl: any;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  primary: string;
  text: string;
  textMuted: string;
  cardBackground: string;
  isDark: boolean;
}

export const CityCard: React.FC<CityCardProps> = ({
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
        <View style={{ height: 220, width: '100%', position: 'relative' }}>
          {/* Background Image */}
          <Image
            source={ imageUrl }
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
            }}
          />

          {/* Glassmorphic Content */}
          <View style={{ flex: 1, justifyContent: 'flex-end',}}>
            <View
              style={{
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  padding: 10,
                  backgroundColor:'rgba(0, 0, 0, 0.6)',
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
                        fontFamily: FONT_FAMILY.poppinsBold,
                      }}
                    >
                      {city}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: FONT_FAMILY.poppinsRegular,
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
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};
