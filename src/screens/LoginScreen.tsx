import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Animated, Dimensions, Platform, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from '../components/ui/Logo';
import { Mail, Loader2, MapPin, Check } from 'lucide-react-native';
import magically from 'magically-sdk';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { CityCard } from '../components/CityCard';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const { setSelectedCity } = useUserPreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showCitySelection, setShowCitySelection] = useState(false);
  const [selectedCity, setLocalSelectedCity] = useState<'Kelowna' | 'Nelson' | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const stageGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(stageGlowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(stageGlowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const triggerAuth = async (provider: 'google' | 'apple' | 'email') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await magically.auth.triggerAuthenticationFlow(provider);
      // After successful auth, show city selection
      setShowCitySelection(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleCitySelect = (city: 'Kelowna' | 'Nelson') => {
    setLocalSelectedCity(city);
  };

  const handleConfirmCity = () => {
    if (selectedCity) {
      setSelectedCity(selectedCity);
    }
  };

  const AuthButton = ({ 
    onPress, 
    icon, 
    label, 
    provider,
    bgColor,
    textColor,
    borderColor
  }: { 
    onPress: () => void; 
    icon?: any; 
    label: string; 
    provider: string;
    bgColor: string;
    textColor: string;
    borderColor?: string;
  }) => {
    const buttonScale = useRef(new Animated.Value(1)).current;
    const isCurrentLoading = isLoading && loadingProvider === provider;

    const handlePressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            backgroundColor: bgColor,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: borderColor ? 1 : 0,
            borderColor: borderColor || 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {isCurrentLoading ? (
            <Loader2 size={24} color={textColor} style={{ marginRight: 12 }} />
          ) : icon ? (
            <View style={{ marginRight: 12 }}>
              {icon}
            </View>
          ) : null}
          <Text
            style={{
              color: textColor,
              fontSize: 17,
              fontWeight: '600',
              letterSpacing: 0.3,
            }}
          >
            {isCurrentLoading ? 'Connecting...' : label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const glowOpacity = stageGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Show city selection after login
  if (showCitySelection) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBarStyle === 'light' ? 'light' : 'dark'} />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: 60 }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 48 }}>
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
                    color: theme.text,
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  Choose Your City
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.textMuted,
                    textAlign: 'center',
                    lineHeight: 24,
                    paddingHorizontal: 20,
                  }}
                >
                  Select your location to discover live music events in your area
                </Text>
              </View>

              {/* City Cards */}
              <View style={{ gap: 20, marginBottom: 40 }}>
                {/* Kelowna Card */}
                <CityCard
                  city="Kelowna"
                  imageUrl="https://trymagically.com/api/media/image?query=kelowna%20bc%20canada%20city%20beautiful%20okanagan%20lake%20sunset"
                  description="Okanagan's vibrant music scene"
                  isSelected={selectedCity === 'Kelowna'}
                  onSelect={() => handleCitySelect('Kelowna')}
                  primary={theme.primary}
                  text={theme.text}
                  textMuted={theme.textMuted}
                  cardBackground={theme.cardBackground}
                  isDark={theme.statusBarStyle === 'dark'}
                />

                {/* Nelson Card */}
                <CityCard
                  city="Nelson"
                  imageUrl="https://trymagically.com/api/media/image?query=nelson%20bc%20canada%20city%20mountains%20kootenay%20lake"
                  description="Kootenay's eclectic music hub"
                  isSelected={selectedCity === 'Nelson'}
                  onSelect={() => handleCitySelect('Nelson')}
                  primary={theme.primary}
                  text={theme.text}
                  textMuted={theme.textMuted}
                  cardBackground={theme.cardBackground}
                  isDark={theme.statusBarStyle === 'dark'}
                />
              </View>

              {/* Confirm Button */}
              {selectedCity && (
                <Pressable
                  onPress={handleConfirmCity}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
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
                      Continue with {selectedCity}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBarStyle === 'light' ? 'light' : 'dark'} />
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                minHeight: height - 100,
                justifyContent: 'space-between',
                paddingTop: 60,
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }],
                    marginBottom: 32,
                    position: 'relative',
                  }}
                >
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: -20,
                      left: -20,
                      right: -20,
                      bottom: -20,
                      backgroundColor: theme.primary,
                      borderRadius: 80,
                      opacity: glowOpacity,
                      transform: [{ scale: pulseAnim }],
                    }}
                  />
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: theme.cardBackground,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 3,
                      borderColor: theme.primary,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 10,
                    }}
                  >
                    <Logo size={60} />
                  </View>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: '800',
                      color: theme.text,
                      marginBottom: 12,
                      textAlign: 'center',
                      letterSpacing: -0.5,
                    }}
                  >
                    Live Tonight
                  </Text>
                </Animated.View>

                <Text
                  style={{
                    fontSize: 17,
                    color: theme.textMuted,
                    textAlign: 'center',
                    lineHeight: 24,
                    paddingHorizontal: 20,
                    marginBottom: 8,
                  }}
                >
                  Discover live music in Kelowna & Nelson
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: theme.primary + '15',
                    borderRadius: 20,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.primary,
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.primary,
                      fontWeight: '600',
                      letterSpacing: 0.3,
                    }}
                  >
                    Your backstage pass to local shows
                  </Text>
                </View>
              </View>

              <View style={{ gap: 16, marginTop: 40 }}>
                <AuthButton
                  onPress={() => triggerAuth('google')}
                  icon={
                    <Image
                      source={{ uri: 'https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/google.png' }}
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
                  }
                  label="Continue with Google"
                  provider="google"
                  bgColor={theme.cardBackground}
                  textColor={theme.text}
                  borderColor={theme.border}
                />

                <AuthButton
                  onPress={() => triggerAuth('apple')}
                  icon={
                    <Image
                      source={{ uri: 'https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/apple.png' }}
                      style={{ 
                        width: 24, 
                        height: 24,
                        tintColor: theme.statusBarStyle === 'dark' ? theme.text : undefined
                      }}
                      resizeMode="contain"
                    />
                  }
                  label="Continue with Apple"
                  provider="apple"
                  bgColor={theme.text}
                  textColor={theme.background}
                />

                <AuthButton
                  onPress={() => triggerAuth('email')}
                  icon={<Mail size={24} color={theme.primaryForeground} />}
                  label="Continue with Email"
                  provider="email"
                  bgColor={theme.primary}
                  textColor={theme.primaryForeground}
                />

                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textLight,
                    textAlign: 'center',
                    marginTop: 24,
                    lineHeight: 20,
                    paddingHorizontal: 32,
                  }}
                >
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}