/**
 * @component GenreSelector
 * @description Multi-select genre chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import {
  ChevronDown,
  ChevronRight,
  Music,
  Search,
  X,
} from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { decodeHtmlEntities, fetchGenres } from "../services/eventService";
import { FONT_FAMILY } from "../utils/fontConfig";
import { MagicallyAlert } from "./ui";

export const GenreSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const {
    favoriteGenres,
    toggleFavoriteGenre,
    isPremium,
    allGenres,
    selectedCity,
  } = useUserPreferences();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentCityGenres = favoriteGenres?.[selectedCity] || [];

  // Filter genres based on search query
  const filteredGenres = allGenres.filter((genre) =>
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenrePress = (genreName: string) => {
    const isAlreadySelected = currentCityGenres.includes(genreName);
    
    // If it's already selected, allow deselection
    if (isAlreadySelected) {
      toggleFavoriteGenre(genreName);
      return;
    }

    // For free users, block all selections
    if (!isPremium) {
      MagicallyAlert.alert(
        "Oops — this one's a Premium feature!",
        "Upgrade to Premium to unlock this feature and fully customize your shows feed with the shows you care about."
      );
      return;
    }

    toggleFavoriteGenre(genreName);
  };

  if (allGenres.length === 0) {
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
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: text,
              fontFamily: FONT_FAMILY.poppinsBlack,
            }}
          >
            Favourite Genres
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: textMuted,
            fontWeight: "600",
            fontFamily: FONT_FAMILY.poppinsSemiBold,
          }}
        >
          Loading genres...
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
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: text,
                fontFamily: FONT_FAMILY.poppinsBlack,
              }}
            >
              Favourite Genres
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
                Select your favourite music to see matching shows in the "Shows" tab
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
              placeholder="Search genres..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 14,
                color: text,
                fontFamily: FONT_FAMILY.poppinsRegular,
                paddingVertical: 12,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={{ marginLeft: 8 }}
              >
                <X size={18} color={textMuted} />
              </Pressable>
            )}
          </View>

          {/* Genres List */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {filteredGenres.length > 0 ? (
              filteredGenres.map((genre) => {
                const decodedName = decodeHtmlEntities(genre.name);
                const isSelected = currentCityGenres.includes(genre.name);
                const canSelect = isPremium || isSelected;

                return (
                  <Pressable
                    key={genre.id}
                    onPress={() => handleGenrePress(genre.name)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: isSelected ? primary : border,
                      backgroundColor: isSelected
                        ? primary + "20"
                        : "transparent",
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
                No genres found matching "{searchQuery}"
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
            THIS IS A PREMIUM FEATURE — UPGRADE TO UNLOCK
          </Text>
        </View>
      )}
    </View>
  );
};
