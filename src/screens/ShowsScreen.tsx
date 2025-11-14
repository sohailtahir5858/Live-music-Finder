/**
 * @screen ShowsScreen
 * @description Home screen displaying all live music shows with city toggle and filtering
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  MapPin,
  Calendar,
  Heart,
  Search,
  SlidersVertical,
  LucideTableOfContents
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { FONT_FAMILY } from "../utils/fontConfig";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { useFilterStore } from "../stores/filterStore";
import { Show, Shows } from "../magically/entities/Show";
import { Skeleton } from "../components/ui/Skeleton";
import magically from "magically-sdk";
import { ShowListItem } from "../components/ShowListItem";
import { Image } from "expo-image";
import { fetchEvents } from "../services/eventService";

export const ShowsScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground } =
    useTheme();
  const navigation = useNavigation<any>();
  const {
    selectedCity,
    setSelectedCity,
    favoriteArtists,
    toggleFavoriteArtist,
    favoriteShows,
    toggleFavoriteShow,
    isPremium,
    viewMode,
    setViewMode,
    hasLoadedPreferences,
    allGenres,
  } = useUserPreferences();
  const { activeFilters, hasActiveFilters } = useFilterStore();

  const [shows, setShows] = useState<Show[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalShows, setTotalShows] = useState(0);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Helper function to convert genre names to category IDs
  const genreNamesToIds = (genreNames: string[]): string[] => {
    return genreNames
      .map(name => {
        const genre = allGenres.find(g => g.name === name);
        return genre?.id.toString();
      })
      .filter((id): id is string => id !== undefined);
  };
 

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Only load shows after preferences (e.g., selected city) have been loaded to avoid duplicate fetches
    if (hasLoadedPreferences) {
      loadShows();
    }
  }, [selectedCity, activeFilters, hasLoadedPreferences]);

  const loadShows = async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoadingShows(true);
        setShows([]);
        setCurrentPage(1);
        setHasMore(true);
      }

      // Build filter options from activeFilters
      // Convert genre names to category IDs
      const categoryIds =
        activeFilters.genres && activeFilters.genres.length > 0
          ? genreNamesToIds(activeFilters.genres)
          : undefined;

      const filterOptions = {
        categoryIds,
        timeFilter: activeFilters.timeFilter,
        dateFrom: activeFilters.dateFrom,
        dateTo: activeFilters.dateTo,
      };
console.log("Loading shows with filters:", filterOptions);

      const result = await fetchEvents(selectedCity, page, filterOptions);
      console.log("🚀 ~ loadShows ~ result:", result)
      setTotalShows(result.total);
      if (page === 1) {
        setShows(result.events);
      } else {
        setShows((prev) => [...prev, ...result.events]);
      }
      setCurrentPage(page);
      setHasMore(result.events.length > 0);
    } catch (error) {
      console.error("Error loading shows:", error);
    } finally {
      setIsLoadingShows(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadShows(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadShows(1);
    setIsRefreshing(false);
  };

  const handleShowPress = (show: Show) => {
    navigation.navigate("ShowDetail", { show });
  };

  const handleFilterPress = () => {
    navigation.navigate("Filter");
  };

  const handleFavoritePress = (show: Show) => {
    if (!magically.auth.currentUser) {
      navigation.navigate("Login");
      return;
    }
    toggleFavoriteShow(show);
  };

  const isFavorite = (showId: string) => favoriteShows.some(s => s._id === showId);

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flex: 1, backgroundColor: background }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <View style={{ marginTop: 12, marginBottom: 24,paddingHorizontal:Platform.OS=='android'? 20:10 }}>
              {/* Top row: Logo + Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                {/* Logo text with styling */}
                <View style={{ flex: 1 }}>
                  <Image source={selectedCity=='Kelowna'? require('./../../assets/images/Live-Music-Kelowna-White.png'):require('./../../assets/images/live-music-logo-white.png')} style={{width:170, height:70, resizeMode:'contain'}} />
                </View>

                {/* View Mode Toggle + Filter Buttons */}
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  {/* VIEW Button */}
                  <Pressable
                    onPress={() =>
                      setViewMode(viewMode === "card" ? "list" : "card")
                    }
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: viewMode === "list"? secondary: cardBackground,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                    }}
                  >
                    {/* Dots with lines icon */}
                    <View style={{ gap: 2, alignItems: "center" }}>
                     <LucideTableOfContents color={viewMode === "list"? 'white': secondary} style={{ transform: [{ rotate: "180deg" }] }} size={20} />
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        fontFamily: FONT_FAMILY.poppinsSemiBold,
                        color: 'white',
                        letterSpacing: 0.3,
                      }}
                    >
                      VIEW
                    </Text>
                  </Pressable>

                  {/* FILTER Button */}
                  <Pressable
                    onPress={handleFilterPress}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: hasActiveFilters()
                        ? primary
                        : cardBackground,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                      borderColor: primary,
                    }}
                  >
                    {/* Vertical lines with dots icon */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 2,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      
                      <SlidersVertical color={hasActiveFilters()?'white':secondary} size={20}/>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        fontFamily: FONT_FAMILY.poppinsSemiBold,
                        color: 'white',
                        letterSpacing: 0.3,
                      }}
                    >
                      FILTER
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Shows count with dividers */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'white',
                    borderColor:'white'
                  }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    fontFamily: FONT_FAMILY.poppinsBold,
                    color: text,
                    letterSpacing: 0.2,
                  }}
                >
                  {totalShows}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: textMuted,
                    fontFamily: FONT_FAMILY.poppinsMedium
                  }}
                >
                  Upcoming Shows
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'white',
                    borderColor:'white'
                  }}
                />
              </View>
            </View>

            {/* Shows List */}
            {isLoadingShows ? (
              <View style={{ paddingHorizontal: 20, }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    width="100%"
                    height={viewMode === "card" ? 280 : 80}
                    style={{
                      marginBottom: viewMode === "card" ? 24 : 12,
                      borderRadius: viewMode === "card" ? 24 : 16,
                    }}
                  />
                ))}
              </View>
            ) : shows.length === 0 ? (
              <View style={{ padding: 32, alignItems: "center" }}>
                <Text
                  style={{
                    color: textMuted,
                    fontSize: 16,
                    fontFamily: FONT_FAMILY.poppinsRegular,
                    textAlign: "center",
                  }}
                >
                  No shows available
                </Text>
              </View>
            ) : (
              <FlatList
                data={shows}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                  <React.Fragment key={item._id}>
                    {viewMode === "card" ? (
                      <ShowCard
                        show={item}
                        onPress={() => handleShowPress(item)}
                        onFavoritePress={() => handleFavoritePress(item)}
                        isFavorite={isFavorite(item._id)}
                        isPremium={isPremium}
                        index={index}
                        primary={primary}
                        secondary={secondary}
                        cardBackground={cardBackground}
                        text={text}
                        textMuted={textMuted}
                      />
                    ) : (
                      <ShowListItem
                        show={item}
                        onPress={() => handleShowPress(item)}
                        onFavoritePress={() => handleFavoritePress(item)}
                        isFavorite={isFavorite(item._id)}
                        isPremium={isPremium}
                      />
                    )}
                  </React.Fragment>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={primary}
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isLoadingMore ? (
                    <ActivityIndicator
                      size="large"
                      color={primary}
                      style={{ marginVertical: 20 }}
                    />
                  ) : null
                }
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </View>
  );
};

interface ShowCardProps {
  show: Show;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  isPremium: boolean;
  index: number;
  primary: string;
  secondary: string;
  cardBackground: string;
  text: string;
  textMuted: string;
}

const ShowCard = ({
  show,
  onPress,
  onFavoritePress,
  isFavorite,
  isPremium,
  index,
  primary,
  secondary,
  cardBackground,
  text,
  textMuted,
}: ShowCardProps) => {
  const cardScale = React.useRef(new Animated.Value(1)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;
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

  const handleFavorite = () => {
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
    onFavoritePress();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return (
    <Animated.View
      style={{ marginBottom: 24,paddingHorizontal:Platform.OS=='android'? 20:10,transform: [{ scale: cardScale }] }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: cardBackground,
          }}
        >
          {/* Show Image */}
          <View style={{ height: 200, position: "relative", overflow: "hidden" }}>
            <Image
              source={
                show.imageUrl ||
                `https://trymagically.com/api/media/image?query=${encodeURIComponent(
                  show.artist + " live music"
                )}`
              }
              style={{ width: '100%', height: '100%' }}
              contentPosition="top center"
              contentFit="cover"
            />

            {/* Favorite Button */}
            <Pressable
              onPress={handleFavorite}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#0A0A0AE6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={20}
                  color={isFavorite ? "#EF4444" : "#FFFFFF"}
                  fill={isFavorite ? "#EF4444" : "transparent"}
                  strokeWidth={2.5}
                />
              </Animated.View>
            </Pressable>

            {/* Event Categories */}
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                flexDirection: "row",
                gap: 8,
              }}
            >
              {show.genre.slice(0, 2).map((genre, i) => (
                <View key={i} style={{ borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: "#f2a41e",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsExtraBold,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {genre.replace(';', '').trim()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Show Info */}
          <View style={{ padding: 18 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                fontFamily: FONT_FAMILY.poppinsExtraBold,
                color: text,
                marginBottom: 8,
              }}
            >
              {show.artist}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <MapPin size={16} color={primary} strokeWidth={2.5} />
              <Text
                style={{ fontSize: 14, color: textMuted, fontWeight: "600", fontFamily: FONT_FAMILY.poppinsSemiBold }}
              >
                {show.venue}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Calendar size={16} color={secondary} strokeWidth={2.5} />
              <Text
                style={{ fontSize: 14, color: textMuted, fontWeight: "600", fontFamily: FONT_FAMILY.poppinsSemiBold }}
              >
                {formatDate(show.date)} • {show.time}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};
