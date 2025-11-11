/**
 * @component VenueSelector
 * @description Accordion-style multi-select venue chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MapPin, ChevronDown, ChevronRight } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { decodeHtmlEntities, fetchVenues } from "../services/eventService";
import { FONT_FAMILY } from "../utils/fontConfig";

export const VenueSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const {
    favoriteVenues,
    toggleFavoriteVenue,
    selectedCity,
    allVenues,
    isPremium,
  } = useUserPreferences();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentCityVenues = favoriteVenues?.[selectedCity] || [];

  const handleVenuePress = (venueName: string) => {
    const isAlreadySelected = currentCityVenues.includes(venueName);
    const canSelect =
      isPremium || isAlreadySelected || currentCityVenues.length < 3;

    if (!canSelect) {
      // User has reached limit - don't toggle
      return;
    }

    toggleFavoriteVenue(venueName);
  };

  if (allVenues.length === 0) {
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
          <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.proximanovaBlack }}>
            Favorite Venues
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: "600", fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
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
        padding: 20,
      }}
    >
      {/* Accordion Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <MapPin size={20} color={primary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.proximanovaBlack }}>
              Favorite Venues
            </Text>
            {!isExpanded && (
              <Text
                style={{
                  fontSize: 13,
                  color: textMuted,
                  fontWeight: "600",
                  marginTop: 4,
                  fontFamily: FONT_FAMILY.proximaNovaSemiBold,
                }}
              >
                Select your favourite venues to see matching shows in the "My
                Feed" tab ({currentCityVenues.length}/3)
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

      {isExpanded && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 30,
          }}
        >
          {allVenues.map((venue) => {
            const decodedName = decodeHtmlEntities(venue.venue);

            const isSelected = currentCityVenues.includes(venue.venue);
            const canSelect =
              isPremium || isSelected || currentCityVenues.length < 3;

            return (
              <Pressable
                key={venue.id}
                onPress={() => handleVenuePress(venue.venue)}
                disabled={!canSelect && !isSelected}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  borderWidth: 2,
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
                    fontFamily: FONT_FAMILY.proximaNovaBold,
                  }}
                >
                  {decodedName}
                </Text>
              </Pressable>
            );
          })}
          <Text
            style={{
              fontSize: 12,
              color: textMuted,
              fontWeight: "500",
              marginTop: 16,
              letterSpacing: 0.3,
              fontFamily: FONT_FAMILY.proximaNova,
            }}
          >
            WITH FREE ACCOUNT USERS CAN ONLY SELECT 3 OF EACH
          </Text>
        </View>
      )}
    </View>
  );
};
