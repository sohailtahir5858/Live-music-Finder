/**
 * @screen NotificationsScreen
 * @description Screen for managing notification preferences and viewing notification history
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { Bell, BellOff, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../utils/fontConfig';
import { useUserPreferences } from '../stores/userPreferencesStore';
import magically from 'magically-sdk';

export const NotificationsScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground, border } = useTheme();
  const navigation = useNavigation<any>();
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationFrequency,
    setNotificationFrequency,
    isPremium,
  } = useUserPreferences();

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  if (!magically.auth.currentUser) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }} edges={['top']}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: '#f2a41e' }}>
              <Lock size={36} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: text, textAlign: 'center', marginBottom: 12, fontFamily: FONT_FAMILY.poppinsBlack }}>
              Sign In Required
            </Text>
            <Text style={{ fontSize: 15, color: textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22, fontFamily: FONT_FAMILY.poppinsRegular }}>
              Sign in to enable notifications for your favorite shows and never miss a live music event!
            </Text>
            <Pressable onPress={handleLoginPress} style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}>
              <View style={{ paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', backgroundColor: '#f2a41e' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_FAMILY.poppinsBlack }}>
                  Sign In
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 24 }}>
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

          {/* Premium Upsell */}
          {!isPremium && (
            <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
              <View style={{ padding: 20, backgroundColor: '#f2a41e' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, fontFamily: FONT_FAMILY.poppinsBlack }}>
                  Upgrade to Premium
                </Text>
                <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600', lineHeight: 18, opacity: 0.95, fontFamily: FONT_FAMILY.poppinsSemiBold }}>
                  Get instant alerts for your favorite artists, genres, and venues • Unlimited favorites • 100% ad-free
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Profile')}
                  style={{ backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: primary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5, fontFamily: FONT_FAMILY.poppinsBlack }}>
                    Go Premium
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Info Card */}
          <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 12, fontFamily: FONT_FAMILY.poppinsBlack }}>
              About Notifications
            </Text>
            <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', lineHeight: 20, fontFamily: FONT_FAMILY.poppinsSemiBold }}>
              We'll send you notifications when new shows are added that match your favorite genres, venues, or artists. You can manage your favorites from the Shows and Favorites tabs.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};