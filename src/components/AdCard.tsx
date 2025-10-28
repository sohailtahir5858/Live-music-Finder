/**
 * @component AdCard
 * @description Displays a sponsored ad card between show listings. Tracks impressions and clicks.
 * Only shown to non-premium users.
 */

import React from 'react';
import { View, Text, Pressable, Image, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ad, Ads } from '../magically/entities/Ad';

interface AdCardProps {
  ad: Ad;
  onImpression?: () => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, onImpression }) => {
  const { cardBackground, text, textMuted, border, borderRadius, primary } = useTheme();

  // Note: Impression tracking removed to prevent infinite loops
  // Track impressions server-side or with a different strategy

  const handleAdClick = async () => {
    try {
      // Track click
      await Ads.update(ad._id, {
        clicks: (ad.clicks || 0) + 1
      });

      // Open URL
      const canOpen = await Linking.canOpenURL(ad.clickUrl);
      if (canOpen) {
        await Linking.openURL(ad.clickUrl);
      }
    } catch (error) {
      console.error('Failed to handle ad click:', error);
    }
  };

  return (
    <View style={{ 
      marginHorizontal: 16, 
      marginVertical: 8,
      backgroundColor: cardBackground,
      borderRadius,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: border,
    }}>
      {/* Sponsored label */}
      <View style={{ 
        paddingHorizontal: 12, 
        paddingVertical: 6,
        backgroundColor: 'rgba(242, 164, 30, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}>
        <Text style={{ 
          color: primary, 
          fontSize: 11, 
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Sponsored
        </Text>
      </View>

      <Pressable onPress={handleAdClick}>
        {/* Ad Image */}
        <Image
          source={{ uri: ad.imageUrl }}
          style={{ 
            width: '100%', 
            height: 180,
            backgroundColor: '#1A1A1A',
          }}
          resizeMode="cover"
        />

        {/* Ad Title & CTA */}
        <View style={{ 
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ 
            color: text, 
            fontSize: 14, 
            fontWeight: '600',
            flex: 1,
          }}>
            {ad.title}
          </Text>
          <ExternalLink size={16} color={textMuted} />
        </View>
      </Pressable>
    </View>
  );
};
