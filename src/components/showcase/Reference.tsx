import React from 'react';
import { View, Text, ScrollView, Animated, Pressable, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music2, MapPin, Calendar, Heart, Sparkles, Clock, Star, TrendingUp } from 'lucide-react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#0A0A0A',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cardBg: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

const MOCK_SHOWS = [
  {
    id: '1',
    artist: 'The Midnight Riders',
    venue: 'The Laurel Packinghouse',
    city: 'Kelowna',
    date: '2025-10-25',
    time: '8:00 PM',
    genre: ['Rock', 'Indie'],
    image: 'https://trymagically.com/api/media/image?query=live%20rock%20band%20performing%20on%20stage%20with%20purple%20lights',
    price: '$25',
    isFavorite: false,
    popularity: 4.8,
    attendees: 234,
  },
  {
    id: '2',
    artist: 'Luna Eclipse',
    venue: 'The Royal Theatre',
    city: 'Nelson',
    date: '2025-10-26',
    time: '9:00 PM',
    genre: ['Electronic', 'House'],
    image: 'https://trymagically.com/api/media/image?query=electronic%20music%20dj%20performing%20with%20blue%20neon%20lights',
    price: '$30',
    isFavorite: true,
    popularity: 4.9,
    attendees: 456,
  },
];

export const Reference = () => {
  const [shows, setShows] = React.useState(MOCK_SHOWS);
  const [selectedCity, setSelectedCity] = React.useState('Kelowna');
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const toggleFavorite = (id: string) => {
    setShows(shows.map(show => 
      show.id === id ? { ...show, isFavorite: !show.isFavorite } : show
    ));
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={[COLORS.purple + '15', COLORS.background, COLORS.background]}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingTop: 70,
          }}
        >
          <View style={{ paddingHorizontal: 28, marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
              <LinearGradient
                colors={[COLORS.purple, COLORS.blue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Music2 size={28} color={COLORS.textPrimary} strokeWidth={2.5} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 34, 
                  fontWeight: '900', 
                  color: COLORS.textPrimary,
                  letterSpacing: -1,
                }}>
                  Live Tonight
                </Text>
                <Text style={{ 
                  fontSize: 15, 
                  color: COLORS.textSecondary,
                  fontWeight: '600',
                  marginTop: 2,
                }}>
                  Experience the magic of live music
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 28, gap: 14 }}>
              {['Kelowna', 'Nelson'].map((city) => {
                const isSelected = selectedCity === city;
                const buttonScale = React.useRef(new Animated.Value(1)).current;

                const handlePressIn = () => {
                  Animated.spring(buttonScale, {
                    toValue: 0.95,
                    useNativeDriver: true,
                    friction: 8,
                  }).start();
                };

                const handlePressOut = () => {
                  Animated.spring(buttonScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 8,
                  }).start();
                };

                return (
                  <Animated.View
                    key={city}
                    style={{
                      flex: 1,
                      transform: [{ scale: buttonScale }],
                    }}
                  >
                    <Pressable
                      onPress={() => setSelectedCity(city)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 24,
                        borderRadius: 20,
                        backgroundColor: isSelected ? 'transparent' : COLORS.cardBg,
                        overflow: 'hidden',
                      }}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={[COLORS.purple, COLORS.blue]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                        />
                      )}
                      <Text style={{
                        color: COLORS.textPrimary,
                        fontWeight: '800',
                        fontSize: 16,
                        textAlign: 'center',
                        letterSpacing: 0.5,
                      }}>
                        {city}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            {shows.map((show, index) => (
              <ShowCard 
                key={show.id} 
                show={show} 
                index={index}
                onToggleFavorite={toggleFavorite}
                scaleAnim={scaleAnim}
                shimmerTranslate={shimmerTranslate}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const ShowCard = ({ show, index, onToggleFavorite, scaleAnim, shimmerTranslate }) => {
  const cardScale = React.useRef(new Animated.Value(1)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.4,
        duration: 120,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
    onToggleFavorite(show.id);
  };

  return (
    <Animated.View
      style={{
        marginBottom: 32,
        transform: [{ scale: Animated.multiply(cardScale, scaleAnim) }],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={{
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: COLORS.cardBg,
        }}>
          <Animated.View style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: 30,
            opacity: glowOpacity,
          }}>
            <LinearGradient
              colors={[COLORS.purple + '40', COLORS.blue + '40', COLORS.purple + '40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderRadius: 30,
              }}
            />
          </Animated.View>

          <View style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
            <Image
              source={show.image}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: [{ translateX: shimmerTranslate }],
              }}
            >
              <LinearGradient
                colors={['transparent', COLORS.textPrimary + '10', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flex: 1,
                  width: width * 2,
                }}
              />
            </Animated.View>

            <LinearGradient
              colors={['transparent', COLORS.background + 'F2']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 140,
              }}
            />
            
            <Pressable
              onPress={handleFavoritePress}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: COLORS.background + 'E6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart 
                  size={24} 
                  color={show.isFavorite ? '#EF4444' : COLORS.textPrimary}
                  fill={show.isFavorite ? '#EF4444' : 'transparent'}
                  strokeWidth={2.5}
                />
              </Animated.View>
            </Pressable>

            <View style={{
              position: 'absolute',
              top: 20,
              left: 20,
              flexDirection: 'row',
              gap: 10,
            }}>
              {show.genre.map((genre, i) => (
                <View
                  key={i}
                  style={{
                    overflow: 'hidden',
                    borderRadius: 14,
                  }}
                >
                  <LinearGradient
                    colors={[COLORS.purple, COLORS.blue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{
                      color: COLORS.textPrimary,
                      fontSize: 13,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      {genre}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            <View style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.background + 'CC',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                gap: 6,
              }}>
                <Star size={16} color={COLORS.purple} fill={COLORS.purple} />
                <Text style={{
                  color: COLORS.textPrimary,
                  fontSize: 14,
                  fontWeight: '700',
                }}>
                  {show.popularity}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.background + 'CC',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                gap: 6,
              }}>
                <TrendingUp size={16} color={COLORS.blue} />
                <Text style={{
                  color: COLORS.textPrimary,
                  fontSize: 14,
                  fontWeight: '700',
                }}>
                  {show.attendees}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 24 }}>
            <Text style={{
              fontSize: 26,
              fontWeight: '900',
              color: COLORS.textPrimary,
              marginBottom: 10,
              letterSpacing: -0.8,
            }}>
              {show.artist}
            </Text>

            <View style={{ gap: 14, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.purple + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MapPin size={18} color={COLORS.purple} strokeWidth={2.5} />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: COLORS.textSecondary,
                  marginLeft: 14,
                  fontWeight: '700',
                  flex: 1,
                }}>
                  {show.venue}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: COLORS.purple,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  {show.city}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.blue + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Calendar size={18} color={COLORS.blue} strokeWidth={2.5} />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: COLORS.textSecondary,
                  marginLeft: 14,
                  fontWeight: '700',
                }}>
                  {new Date(show.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.purple + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={18} color={COLORS.purple} strokeWidth={2.5} />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: COLORS.textSecondary,
                  marginLeft: 14,
                  fontWeight: '700',
                }}>
                  Doors open at {show.time}
                </Text>
              </View>
            </View>

            <View style={{
              marginTop: 24,
              paddingTop: 24,
              borderTopWidth: 2,
              borderTopColor: COLORS.purple + '15',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View>
                <Text style={{
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}>
                  Starting At
                </Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '900',
                  color: COLORS.textPrimary,
                  letterSpacing: -1,
                }}>
                  {show.price}
                </Text>
              </View>

              <View style={{
                overflow: 'hidden',
                borderRadius: 18,
              }}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.blue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 18,
                  }}
                >
                  <Text style={{
                    color: COLORS.textPrimary,
                    fontSize: 17,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}>
                    Get Tickets
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};