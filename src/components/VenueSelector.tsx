/**
 * @component VenueSelector
 * @description Accordion-style multi-select venue chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { MapPin, ChevronDown, ChevronRight, Search, X } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { decodeHtmlEntities, fetchVenues } from "../services/eventService";
import { FONT_FAMILY } from "../utils/fontConfig";
import { MagicallyAlert } from "./ui";

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
  const [searchQuery, setSearchQuery] = useState("");

  const currentCityVenues = favoriteVenues?.[selectedCity] || [];

  // Filter venues based on search query
  const filteredVenues = allVenues.filter((venue) =>
    venue.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVenuePress = (venueName: string) => {
    const isAlreadySelected = currentCityVenues.includes(venueName);
    
    // If it's already selected, allow deselection
    if (isAlreadySelected) {
      toggleFavoriteVenue(venueName);
      return;
    }

    // For free users, check if they're trying to select a 4th venue
    if (!isPremium && currentCityVenues.length >= 3) {
      MagicallyAlert.alert(
        "Oops — this one's a Premium feature!",
        "Upgrade to Premium to unlock this feature and fully customize your shows feed with the shows you care about."
      );
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
          <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.poppinsBlack }}>
            Favorite Venues
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: "600", fontFamily: FONT_FAMILY.poppinsSemiBold }}>
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.poppinsBlack }}>
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
                Select your favourite venues to see matching shows in the "Shows" tab ({currentCityVenues.length}/3)
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
            paddingTop: 20,
          }}
        >
          {/* Search Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: cardBackground,
              borderWidth: 1,
              borderColor: border,
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 20,
              justifyContent: "center",
            }}
          >
            <Search size={18} color={textMuted} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search venues..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 14,
                color: text,
                fontFamily: FONT_FAMILY.poppinsRegular,
                textAlignVertical: "center",
                paddingTop: 15,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} style={{ marginLeft: 8 }}>
                <X size={18} color={textMuted} />
              </Pressable>
            )}
          </View>

          {/* Venues List */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {filteredVenues.length > 0 ? (
              filteredVenues.map((venue) => {
                const decodedName = decodeHtmlEntities(venue.venue);
                const isSelected = currentCityVenues.includes(venue.venue);
                const canSelect =
                  isPremium || isSelected || currentCityVenues.length < 3;

                return (
                  <Pressable
                    key={venue.id}
                    onPress={() => handleVenuePress(venue.venue)}
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
                        fontFamily: FONT_FAMILY.poppinsBold,
                      }}
                    >
                      {decodedName}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  color: textMuted,
                  fontWeight: "500",
                  fontFamily: FONT_FAMILY.poppinsRegular,
                  marginTop: 12,
                }}
              >
                No venues found matching "{searchQuery}"
              </Text>
            )}
          </View>

          <Text
            style={{
              fontSize: 12,
              color: textMuted,
              fontWeight: "500",
              marginTop: 16,
              letterSpacing: 0.3,
              fontFamily: FONT_FAMILY.poppinsRegular,
            }}
          >
            WITH FREE ACCOUNT USERS CAN ONLY SELECT 3 OF EACH
          </Text>
        </View>
      )}
    </View>
  );
};
