/**
 * @screen FavoritesScreen
 * @description Screen displaying shows matching user's favorite genres and venues selected in Profile
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Heart,
  MapPin,
  Calendar,
  Lock,
  Music,
  LucideTableOfContents,
  SlidersVertical,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { FONT_FAMILY } from "../utils/fontConfig";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { useAppStateStore } from "../stores/appStateStore";
import { Show } from "../magically/entities/Show";
import { Skeleton } from "../components/ui/Skeleton";
import magically from "magically-sdk";
import { ShowListItem } from "../components/ShowListItem";
import { Image } from "expo-image";

export const FavoritesScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground } =
    useTheme();
  const navigation = useNavigation<any>();
  const {
    favoriteShows,
    selectedCity,
    isPremium,
    viewMode,
    setViewMode,
    toggleFavoriteShow,
  } = useUserPreferences();
  const { isAuthenticated } = useAppStateStore();

  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

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

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    loadFavoriteShows();
  }, [isAuthenticated, favoriteShows, selectedCity]);

  const loadFavoriteShows = async () => {
    try {
      setIsLoading(true);

      // Filter favorite shows by selected city
      const filteredShows = favoriteShows.filter(
        (show) => show.city === selectedCity
      );

      setShows(filteredShows);
    } catch (error) {
      console.error("Error loading favorite shows:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavoriteShows();
    setRefreshing(false);
  };

  const handleShowPress = (show: Show) => {
    navigation.navigate("ShowDetail", { show });
  };

  const handleFavoritePress = (show: Show) => {
    toggleFavoriteShow(show);
  };

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  const handleGoToProfile = () => {
    navigation.navigate("Shows");
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View
        style={{
          flex: 1,
          backgroundColor: background,
          paddingHorizontal: Platform.OS == "android" ? 20 : 10,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <View
              style={{ paddingHorizontal: 2, marginTop: 12, marginBottom: 24 }}
            >
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: primary,
                        letterSpacing: -0.5,
                      }}
                    >
                      MY
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: text,
                        letterSpacing: -0.5,
                      }}
                    >
                      FAVORITES
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: text,
                      marginTop: 2,
                      letterSpacing: 0.5,
                      fontStyle: "italic",
                    }}
                  >
                    {selectedCity}
                  </Text>
                </View>

                {/* View Mode Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  {/* VIEW Button */}
                  <Pressable
                    onPress={() =>
                      setViewMode(viewMode === "card" ? "list" : "card")
                    }
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor:
                        viewMode === "list" ? secondary : cardBackground,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6,
                    }}
                  >
                    {/* Dots with lines icon */}
                    <View style={{ gap: 2, alignItems: "center" }}>
                      <LucideTableOfContents
                        color={viewMode === "list" ? "white" : secondary}
                        style={{ transform: [{ rotate: "180deg" }] }}
                        size={20}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "white",
                        letterSpacing: 0.3,
                      }}
                    >
                      VIEW
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
                    backgroundColor: "white",
                    borderColor: "white",
                  }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: text,
                    letterSpacing: 0.2,
                  }}
                >
                  {shows.length}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: textMuted,
                    fontWeight: "500",
                  }}
                >
                  Favorite Shows
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "white",
                    borderColor: "white",
                  }}
                />
              </View>
            </View>

            {/* Shows List */}
            {isLoading ? (
              <View style={{ paddingHorizontal: 24 }}>
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
                    textAlign: "center",
                  }}
                >
                  No favorite shows in {selectedCity}
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
                        isFavorite={true}
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
                        isFavorite={true}
                        isPremium={isPremium}
                      />
                    )}
                  </React.Fragment>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={primary}
                  />
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
      style={{ marginBottom: 24, transform: [{ scale: cardScale }] }}
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
          <View style={{ height: 200, position: "relative" }}>
            <Image
              source={
                show.imageUrl ||
                `https://trymagically.com/api/media/image?query=${encodeURIComponent(
                  show.artist + " live music"
                )}`
              }
              style={{ width: "100%", height: "100%" }}
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
                <View key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
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
                      {genre.replace(";", "").trim()}
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
                style={{
                  fontSize: 14,
                  color: textMuted,
                  fontWeight: "600",
                  fontFamily: FONT_FAMILY.poppinsSemiBold,
                }}
              >
                {show.venue}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Calendar size={16} color={secondary} strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 14,
                  color: textMuted,
                  fontWeight: "600",
                  fontFamily: FONT_FAMILY.poppinsSemiBold,
                }}
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
