/**
 * @component GenreSelector
 * @description Multi-select genre chips for user preferences
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ChevronDown, ChevronRight, Music } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { fetchGenres } from "../services/eventService";

export const GenreSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const { favoriteGenres, toggleFavoriteGenre, isPremium } =
    useUserPreferences();
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      // Fetch genres from WordPress API (use Kelowna as default, or get from user preferences)
      const wpGenres = await fetchGenres("Kelowna");
      setGenres(wpGenres);
    } catch (error) {
      console.error("Error loading genres:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenrePress = (genreName: string) => {
    const isAlreadySelected = favoriteGenres.includes(genreName);
    const canSelect =
      isPremium || isAlreadySelected || favoriteGenres.length < 3;

    if (!canSelect) {
      // User has reached limit - don't toggle
      return;
    }

    toggleFavoriteGenre(genreName);
  };

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
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
            Favorite Genres
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: "600" }}>
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
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1}}>
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Favorite Genres
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
                Select your favourite music to see matching shows in the "My
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

      {isExpanded && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8,paddingTop:30 }}>
          {genres.map((genre) => {
            const isSelected = favoriteGenres.includes(genre.name);
            const canSelect =
              isPremium || isSelected || favoriteGenres.length < 3;

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
                  }}
                >
                  {genre.name}
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
            }}
          >
            WITH FREE ACCOUNT USERS CAN ONLY SELECT 3 OF EACH
          </Text>
        </View>
      )}
    </View>
  );
};
