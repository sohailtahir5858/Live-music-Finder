/**
 * @screen ShowDetailScreen
 * @description Detail view for a specific show with full information
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, Share, Linking, Platform } from 'react-native';
import { MapPin, Calendar, Clock, DollarSign, Users, ArrowLeft, Heart, Share2, CalendarPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { showService } from '../services/showService';
import { Show } from '../magically/entities/Show';
import { Skeleton } from '../components/ui/Skeleton';
import { MagicallyAlert } from '../components/ui';
import { AdCard } from '../components/AdCard';
import { Ad, Ads } from '../magically/entities/Ad';
import magically from 'magically-sdk';
import { Image } from 'expo-image';

export const ShowDetailScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { showId } = route.params || {};
  const { favoriteArtists, toggleFavoriteArtist, isPremium, selectedCity } = useUserPreferences();
  
  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showId) {
      loadShow();
      if (!isPremium) {
        loadAd();
      }
    }
  }, [showId, isPremium]);

  const loadShow = async () => {
    try {
      setIsLoading(true);
      const data = await showService.getShowById(showId);
      setShow(data);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading show:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAd = async () => {
    try {
      const now = new Date().toISOString();
      const allAds = await Ads.query(
        { active: true, isPublic: true },
        { limit: 20 }
      );
      console.log('Fetched ads:', allAds);
      const cityFilteredAds = allAds.data.filter(ad => 
        ad.city === selectedCity || ad.city === 'Both'
      );
      const validAds = cityFilteredAds.filter(ad => {
        if (!ad.startDate && !ad.endDate) return true;
        if (ad.startDate && now < ad.startDate) return false;
        if (ad.endDate && now > ad.endDate) return false;
        return true;
      });
      if (validAds.length > 0) {
        setActiveAd(validAds[Math.floor(Math.random() * validAds.length)]);
      }
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  };

  const handleFavoritePress = () => {
    if (!magically.auth.currentUser) {
      navigation.navigate('Login' as never);
      return;
    }
    if (show) {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.4, duration: 120, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start();
      toggleFavoriteArtist(show.artist);
    }
  };

  const handleSharePress = async () => {
    if (!show) return;
    
    try {
      const message = `🎵 ${show.artist} live at ${show.venue}\n📅 ${formatDate(show.date)} at ${show.time}\n📍 ${show.city}\n\nCheck out this show on Live Music ${show.city}!`;
      
      await Share.share({
        message,
        title: `${show.artist} - Live Show`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCalendar = () => {
    if (!show) return;
    
    try {
      // Create calendar event details
      const eventTitle = encodeURIComponent(`${show.artist} at ${show.venue}`);
      const eventDetails = encodeURIComponent(`${show.genre} show. ${show.description || ''}`);
      const eventLocation = encodeURIComponent(`${show.venue}, ${show.city}`);
      
      // Parse date and time
      const eventDate = new Date(show.date);
      const [hours, minutes] = show.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
      
      // Format for calendar URLs (YYYYMMDDTHHMMSS)
      const startTime = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0];
      const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // Assume 3 hour duration
      const endTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0];
      
      // Google Calendar URL (works on all platforms)
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startTime}Z/${endTime}Z&details=${eventDetails}&location=${eventLocation}`;
      
      Linking.openURL(googleCalendarUrl).catch(() => {
        MagicallyAlert.alert('Unable to open calendar', 'Please add the event manually to your calendar.');
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      MagicallyAlert.alert('Error', 'Unable to create calendar event');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isFavorite = show ? favoriteArtists.includes(show.artist) : false;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Skeleton width="100%" height={300} />
          <View style={{ padding: 24 }}>
            <Skeleton width="70%" height={32} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={100} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!show) {
    return (
      <View style={{ flex: 1, backgroundColor: background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: text, textAlign: 'center' }}>
          Show Not Found
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: cardBackground, borderRadius: 12 }}
        >
          <Text style={{ color: primary, fontSize: 15, fontWeight: '700' }}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={{ height: 360, position: 'relative' }}>
              <Image
                source={show.imageUrl || `https://trymagically.com/api/media/image?query=${encodeURIComponent(show.artist + ' live music concert')}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to top, rgba(10, 10, 10, 0.98), transparent)' }} />
              
              {/* Header Overlay */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20 }}>
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Share Button */}
                  <Pressable
                    onPress={handleSharePress}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Share2 size={20} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                  
                  {/* Calendar Button */}
                  <Pressable
                    onPress={handleAddToCalendar}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CalendarPlus size={20} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                  
                  {/* Favorite Button */}
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Pressable
                      onPress={handleFavoritePress}
                      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isFavorite ? primary : 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Heart size={20} color="#FFFFFF" fill={isFavorite ? '#FFFFFF' : 'transparent'} strokeWidth={2.5} />
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
              
              {/* Event Categories */}
              <View style={{ position: 'absolute', bottom: 24, left: 20, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {show.genre.map((genre, i) => (
                  <View key={i} style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#f2a41e', paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {genre}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Artist Name */}
            <Text style={{ fontSize: 32, fontWeight: '900', color: text, marginBottom: 8, letterSpacing: -0.5 }}>
              {show.artist}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textMuted, marginBottom: 24 }}>
              {show.title}
            </Text>

            {/* Details Card */}
            <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 20 }}>
              {/* Venue */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MapPin size={20} color={primary} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                    Venue
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 2 }}>
                    {show.venue}
                  </Text>
                  {show.venueAddress && (
                    <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                      {show.venueAddress}
                    </Text>
                  )}
                </View>
              </View>

              {/* Date & Time */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: secondary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Calendar size={20} color={secondary} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                    Date & Time
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 2 }}>
                    {formatDate(show.date)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color={textMuted} strokeWidth={2.5} />
                    <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                      {show.time}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Price */}
              {show.price && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: show.sourceUrl ? 16 : 0 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981' + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <DollarSign size={20} color="#10b981" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                      Price
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: text }}>
                      {show.price}
                    </Text>
                  </View>
                </View>
              )}

              {/* Event Link */}
              {show.sourceUrl && (
                <Pressable
                  onPress={() => Linking.openURL(show.sourceUrl!)}
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MapPin size={20} color={primary} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                      Event Link
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: primary, textDecorationLine: 'underline' }}>
                      View on Website
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Ad for free users */}
            {!isPremium && activeAd && (
              <View style={{ marginBottom: 20 }}>
                <AdCard ad={activeAd} />
              </View>
            )}

            {/* Description */}
            {show.description && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: text, marginBottom: 12 }}>
                  About This Show
                </Text>
                <Text style={{ fontSize: 15, color: textMuted, fontWeight: '500', lineHeight: 24 }}>
                  {show.description}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};