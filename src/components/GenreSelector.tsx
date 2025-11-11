/**
 * @component GenreSelector
 * @description Multi-select genre chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ChevronDown, ChevronRight, Music } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { decodeHtmlEntities, fetchGenres } from "../services/eventService";
import { FONT_FAMILY } from "../utils/fontConfig";

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

  const currentCityGenres = favoriteGenres?.[selectedCity] || [];

  const handleGenrePress = (genreName: string) => {
    const isAlreadySelected = currentCityGenres.includes(genreName);
    const canSelect =
      isPremium || isAlreadySelected || currentCityGenres.length < 3;

    if (!canSelect) {
      // User has reached limit - don't toggle
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
          <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.proximanovaBlack }}>
            Favorite Genres
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: "600", fontFamily: FONT_FAMILY.proximaNovaSemiBold }}>
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: text, fontFamily: FONT_FAMILY.proximanovaBlack }}>
              Favorite Genres
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
                Select your favourite music to see matching shows in the "My
                Feed" tab ({currentCityGenres.length}/3)
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
          {allGenres.map((genre) => {
            const decodedName = decodeHtmlEntities(genre.name);
            const isSelected = currentCityGenres.includes(genre.name);
            const canSelect =
              isPremium || isSelected || currentCityGenres.length < 3;

            return (
              <Pressable
                key={genre.id}
                onPress={() => handleGenrePress(genre.name)}
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
