/**
 * @component NotificationSettings
 * @description Notification settings UI component - extracted from NotificationsScreen for reuse
 */

import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { FONT_FAMILY } from '../utils/fontConfig';

export const NotificationSettings = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationFrequency,
    setNotificationFrequency,
    isPremium,
  } = useUserPreferences();

  return (
    <View>
      {/* Enable Notifications */}
      <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 6, fontFamily: FONT_FAMILY.poppinsBlack }}>
              Push Notifications
            </Text>
            <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', lineHeight: 18, fontFamily: FONT_FAMILY.poppinsSemiBold }}>
              {isPremium ? 'Get instant alerts when your favorite artist, genre, or venue is coming up' : 'Get general updates about new events'}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: border, true: primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Notification Frequency */}
      {notificationsEnabled && (
        <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 12, fontFamily: FONT_FAMILY.poppinsBlack }}>
            Notification Frequency
          </Text>
          <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', marginBottom: 16, lineHeight: 18, fontFamily: FONT_FAMILY.poppinsSemiBold }}>
            Choose how often you want to receive notifications
          </Text>
          
          {['instant', 'daily', 'weekly'].map((freq) => {
            const isSelected = notificationFrequency === freq;
            const isPremiumFeature = freq === 'instant' && !isPremium;
            
            return (
              <Pressable
                key={freq}
                onPress={() => !isPremiumFeature && setNotificationFrequency(freq as any)}
                disabled={isPremiumFeature}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  backgroundColor: isSelected ? primary + '20' : 'transparent',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? primary : border,
                  marginBottom: 10,
                  opacity: isPremiumFeature ? 0.5 : 1,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: isSelected ? primary : text, fontFamily: FONT_FAMILY.poppinsBold }}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                    {isPremiumFeature && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: primary, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, fontFamily: FONT_FAMILY.poppinsBlack }}>
                          PREMIUM
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: textMuted, fontWeight: '600', marginTop: 4, fontFamily: FONT_FAMILY.poppinsSemiBold }}>
                    {freq === 'instant' && (isPremium ? 'Instant alerts for your favorite artists, genres, and venues' : 'Upgrade to get instant personalized alerts')}
                    {freq === 'daily' && (isPremium ? 'Daily personalized digest matching your favorites' : 'Daily general updates about new events')}
                    {freq === 'weekly' && (isPremium ? 'Weekly curated summary of your favorite genres' : 'Weekly general event list')}
                  </Text>
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? primary : border,
                    backgroundColor: isSelected ? primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};
