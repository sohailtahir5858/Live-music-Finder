/**
 * @screen ProfileScreen
 * @description User profile with subscription management, settings, and account actions
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { User, Bell, MessageSquare, Crown, LogOut, Trash2, ChevronRight, MapPin } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { AnimatedSpinner } from '../components/ui';
import magically from 'magically-sdk';
import { MagicallyAlert } from '../components/ui';
import { NotificationSettings } from '../components/NotificationSettings';
import { GenreSelector } from '../components/GenreSelector';
import { VenueSelector } from '../components/VenueSelector';
import { CityCard } from '../components/CityCard';

export default function ProfileScreen() {
  const { background, text, textMuted, primary, secondary, cardBackground, border, destructive } = useTheme();
  const navigation = useNavigation();
  const { isPremium, setIsPremium, selectedCity, setSelectedCity } = useUserPreferences();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCitySelection, setShowCitySelection] = useState(false);
  const [tempSelectedCity, setTempSelectedCity] = useState<'Kelowna' | 'Nelson' | null>(selectedCity);
  const user = magically.auth.getCurrentUser();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await magically.auth.signOut();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Sign out failed:', error);
      MagicallyAlert.alert('Error', 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    MagicallyAlert.alert(
      'Delete Account?',
      'This will permanently delete your account from this app. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await magically.auth.deleteAccount();
              await magically.auth.signOut();

              if (result.action === 'scheduled') {
                MagicallyAlert.alert(
                  'Scheduled',
                  `Account will be deleted in ${result.daysRemaining} days. Log back in to cancel.`
                );
              } else {
                MagicallyAlert.alert('Deleted', 'Your account has been deleted.');
              }

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error: any) {
              console.error('Delete failed:', error);

              const errorMessage = error.message || '';
              const errorCode = error.responseData?.code || error.responseData?.error || errorMessage;

              if (errorCode === 'OWNER_CANNOT_DELETE' || errorMessage === 'OWNER_CANNOT_DELETE') {
                MagicallyAlert.alert(
                  'Protected Account',
                  'As the app creator, your account keeps this app running. To close your account, you can delete the entire project from your dashboard.\\n\\nTo test account deletion, try logging in with a different account.'
                );
              } else if (errorCode === 'LAST_ADMIN_CANNOT_DELETE' || errorMessage === 'LAST_ADMIN_CANNOT_DELETE') {
                MagicallyAlert.alert(
                  'Admin Required',
                  'Your app needs at least one admin to keep running. Please make someone else an admin before deleting your account.\\n\\nTo test account deletion, try logging in with a non-admin account.'
                );
              } else {
                MagicallyAlert.alert('Error', error.message || 'Failed to delete account. Please try again.');
              }
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handlePremiumUpgrade = () => {
    // Mock premium upgrade - in production, integrate with Stripe or App Store
    MagicallyAlert.alert(
      'Upgrade to Premium',
      'Get instant notifications, unlimited favorites, and ad-free experience for $3.99/month',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            setIsPremium(true);
            MagicallyAlert.alert('Success', 'Welcome to Premium! 🎉');
          },
        },
      ]
    );
  };

  const handlePremiumCancel = () => {
    MagicallyAlert.alert(
      'Cancel Premium?',
      'You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            setIsPremium(false);
            MagicallyAlert.alert('Cancelled', 'Your premium subscription has been cancelled.');
          },
        },
      ]
    );
  };

  const handleCitySelect = (city: 'Kelowna' | 'Nelson') => {
    setTempSelectedCity(city);
  };

  const handleConfirmCityChange = () => {
    if (tempSelectedCity) {
      setSelectedCity(tempSelectedCity);
      setShowCitySelection(false);
      MagicallyAlert.alert('City Updated', `Your location has been changed to ${tempSelectedCity}.`);
    }
  };

  const handleCancelCityChange = () => {
    setTempSelectedCity(selectedCity);
    setShowCitySelection(false);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <View style={{ flex: 1, backgroundColor: background }}>
          <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }} edges={['top']}>
            <User size={64} color={textMuted} strokeWidth={1.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: text, marginTop: 16, textAlign: 'center' }}>
              Sign In Required
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Login' as never)}
              style={{ marginTop: 24, borderRadius: 16, overflow: 'hidden', width: '100%' }}
            >
              <View style={{ paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', backgroundColor: '#f2a41e' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                  Sign In
                </Text>
              </View>
            </Pressable>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View 
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                backgroundColor: primary, 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <User size={36} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: text, marginBottom: 4 }}>
              {user?.name || user?.email || 'Music Lover'}
            </Text>
            {isPremium && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: primary, 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 12 
              }}>
                <Crown size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  PREMIUM
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* City Selection Section */}
        <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <Pressable
            onPress={() => {
              setTempSelectedCity(selectedCity);
              setShowCitySelection(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <MapPin size={18} color={primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 2 }}>
                  Location
                </Text>
                <Text style={{ fontSize: 14, color: textMuted, fontWeight: '500' }}>
                  {selectedCity || 'Select your city'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={textMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Favorite Genres Section */}
        <GenreSelector />

        {/* Favorite Venues Section */}
        <VenueSelector />

        {/* Notification Settings Section */}
        <NotificationSettings />

        {/* Subscription Section */}
        {!isPremium ? (
          <Pressable onPress={handlePremiumUpgrade} style={{ marginBottom: 20, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ padding: 20, backgroundColor: '#f2a41e' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', flex: 1 }}>
                  Go Premium
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600', marginBottom: 16, lineHeight: 20, opacity: 0.95 }}>
                • Instant notifications{'\n'}
                • Unlimited favorites{'\n'}
                • Ad-free experience{'\n'}
                • Priority support
              </Text>
              <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: primary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>
                  Subscribe for $3.99/month
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={{ marginBottom: 20, backgroundColor: cardBackground, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={20} color={primary} strokeWidth={2.5} fill={primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: text }}>
                  Premium Member
                </Text>
                <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', marginTop: 2 }}>
                  Active subscription
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handlePremiumCancel}
              style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: background, borderRadius: 12 }}
            >
              <Text style={{ color: destructive, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Manage Subscription
              </Text>
            </Pressable>
          </View>
        )}

        {/* Menu Items */}
        <View style={{ backgroundColor: cardBackground, borderRadius: 20, marginBottom: 20 }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications' as never)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: border }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Bell size={18} color={primary} strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: text, flex: 1 }}>
              Notifications
            </Text>
            <ChevronRight size={20} color={textMuted} strokeWidth={2.5} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Feedback' as never)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: secondary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <MessageSquare size={18} color={secondary} strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: text, flex: 1 }}>
              Send Feedback
            </Text>
            <ChevronRight size={20} color={textMuted} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          disabled={isSigningOut}
          style={{ marginBottom: 12, backgroundColor: cardBackground, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {isSigningOut ? (
            <AnimatedSpinner size={20} color={textMuted} />
          ) : (
            <LogOut size={20} color={textMuted} strokeWidth={2.5} />
          )}
          <Text style={{ fontSize: 16, fontWeight: '700', color: textMuted }}>
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          style={{ backgroundColor: destructive + '15', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {isDeleting ? (
            <AnimatedSpinner size={20} color={destructive} />
          ) : (
            <Trash2 size={20} color={destructive} strokeWidth={2.5} />
          )}
          <Text style={{ fontSize: 16, fontWeight: '700', color: destructive }}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* City Selection Modal */}
      {showCitySelection && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: background, borderRadius: 20, padding: 20, margin: 20, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: text, textAlign: 'center', marginBottom: 20 }}>
              Change Location
            </Text>
            
            <View style={{ gap: 16, marginBottom: 24 }}>
              <CityCard
                city="Kelowna"
                imageUrl="https://trymagically.com/api/media/image?query=kelowna%20bc%20canada%20city%20beautiful%20okanagan%20lake%20sunset"
                description="Okanagan's vibrant music scene"
                isSelected={tempSelectedCity === 'Kelowna'}
                onSelect={() => handleCitySelect('Kelowna')}
                primary={primary}
                text={text}
                textMuted={textMuted}
                cardBackground={cardBackground}
                isDark={false}
              />

              <CityCard
                city="Nelson"
                imageUrl="https://trymagically.com/api/media/image?query=nelson%20bc%20canada%20city%20mountains%20kootenay%20lake"
                description="Kootenay's eclectic music hub"
                isSelected={tempSelectedCity === 'Nelson'}
                onSelect={() => handleCitySelect('Nelson')}
                primary={primary}
                text={text}
                textMuted={textMuted}
                cardBackground={cardBackground}
                isDark={false}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleCancelCityChange}
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: cardBackground, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleConfirmCityChange}
                disabled={!tempSelectedCity}
                style={{ 
                  flex: 1, 
                  paddingVertical: 14, 
                  paddingHorizontal: 20, 
                  backgroundColor: tempSelectedCity ? primary : textMuted + '40', 
                  borderRadius: 12, 
                  alignItems: 'center' 
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}