/**
 * @component VenueSelector
 * @description Accordion-style multi-select venue chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { fetchVenues } from "../services/eventService";

export const VenueSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const { favoriteVenues, toggleFavoriteVenue, selectedCity } =
    useUserPreferences();
  const [venues, setVenues] = useState<{ id: number; venue: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVenues();
  }, [selectedCity]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      const wpVenues = await fetchVenues(selectedCity);
      console.log("🚀 ~ loadVenues ~ wpVenues:", wpVenues);
      setVenues(wpVenues);
    } catch (error) {
      console.error("Error loading venues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVenuePress = (venueName: string) => {
    const isAlreadySelected = favoriteVenues.includes(venueName);
    // Free users can select up to 3 venues
    const canSelect = isAlreadySelected || favoriteVenues.length < 3;
    console.log("🚀 ~ handleVenuePress ~ canSelect:", canSelect)

    if (!canSelect) {
      return;
    }

    toggleFavoriteVenue(venueName);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: cardBackground,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <MapPin size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
            Favorite Venues
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: "600" }}>
          Loading venues...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: cardBackground,
        borderRadius: 20,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Accordion Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <MapPin size={20} color={primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Favorite Venues
            </Text>
            {!isExpanded && (
              <Text
                style={{
                  fontSize: 13,
                  color: textMuted,
                  fontWeight: "600",
                  marginTop: 4,
                }}
              >
                Select your favourite venues to see matching shows in the "My
                Feed" tab
              </Text>
            )}
          </View>
        </View>
        <View>
          {isExpanded ? (
            <ChevronDown size={24} color={primary} strokeWidth={2.5} />
          ) : (
            <ChevronRight size={24} color={primary} strokeWidth={2.5} />
          )}
        </View>
      </Pressable>

      {/* Accordion Content */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderTopColor: border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 16,
            }}
          >
            {venues.map((venue) => {
              const isSelected = favoriteVenues.includes(venue.venue);
              const canSelect = isSelected || favoriteVenues.length < 3;

              return (
                <Pressable
                  key={venue.id}
                  onPress={() => handleVenuePress(venue.venue)}
                  disabled={!canSelect && !isSelected}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1.5,
                     borderColor: isSelected ? primary : border,
                  backgroundColor: isSelected ? primary + "20" : "transparent",
                  opacity: !canSelect && !isSelected ? 0.4 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isSelected ? primary : text,
                    }}
                  >
                    {venue.venue}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              fontSize: 12,
              color: textMuted,
              fontWeight: "500",
              marginTop: 16,
              letterSpacing: 0.3,
            }}
          >
            WITH FREE ACCOUNT USERS CAN ONLY SELECT 3 OF EACH
          </Text>
        </View>
      )}
    </View>
  );
};
