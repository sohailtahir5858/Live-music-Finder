/**
 * @component ShowListItem
 * @description Condensed list view for shows - compact format with key info
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MapPin, Calendar, Clock, Heart } from 'lucide-react-native';
import { Show } from '../magically/entities/Show';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../utils/fontConfig';

interface ShowListItemProps {
  show: Show;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  isPremium: boolean;
}

export const ShowListItem: React.FC<ShowListItemProps> = ({
  show,
  onPress,
  onFavoritePress,
  isFavorite,
  isPremium,
}) => {
  const { background, text, textMuted, primary, cardBackground } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 24,
        marginBottom: 12,
        padding: 16,
        backgroundColor: cardBackground,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* Left: Date Circle */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#f2a41e20',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#f2a41e',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.proximanovaBlack, color: '#f2a41e' }}>
          {new Date(show.date).getDate()}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '700', fontFamily: FONT_FAMILY.proximaNovaBold, color: '#f2a41e', textTransform: 'uppercase' }}>
          {new Date(show.date).toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>

      {/* Middle: Show Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            fontFamily: FONT_FAMILY.proximanovaBlack,
            color: text,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {show.artist}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={textMuted} strokeWidth={2.5} />
            <Text style={{ fontSize: 12, color: textMuted, fontWeight: '600', fontFamily: FONT_FAMILY.proximaNovaSemiBold }} numberOfLines={1}>
              {show.venue}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color={textMuted} strokeWidth={2.5} />
            <Text style={{ fontSize: 12, color: textMuted, fontWeight: '600', fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
              {show.time}
            </Text>
          </View>
        </View>

        {/* Event Categories */}
        {show.genre && show.genre.length > 0 && show.genre[0] !== 'General' && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {show.genre.slice(0, 2).map((genre, idx) => (
              <View
                key={idx}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: '#f2a41e30',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#f2a41e', fontFamily: FONT_FAMILY.proximaNovaBold }}>
                  {genre}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Right: Favorite Button */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onFavoritePress();
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isFavorite ? '#f2a41e20' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Heart
          size={20}
          color={isFavorite ? '#f2a41e' : textMuted}
          fill={isFavorite ? '#f2a41e' : 'none'}
          strokeWidth={2.5}
        />
      </Pressable>
    </Pressable>
  );
};
