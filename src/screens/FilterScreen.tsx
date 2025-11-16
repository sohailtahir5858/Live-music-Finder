/**
 * @screen FilterScreen
 * @description Advanced filtering screen for shows with multi-select filters
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import {
  ArrowLeft,
  Sliders,
  X,
  Calendar,
  Clock,
  Music2,
  MapPin,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { FONT_FAMILY } from "../utils/fontConfig";
import { showService } from "../services/showService";
import { useUserPreferences } from "../stores/userPreferencesStore";
import { useFilterStore } from "../stores/filterStore";
import {
  fetchGenres,
  fetchVenues,
  WordPressCategory,
  WordPressVenue,
  decodeHtmlEntities,
} from "../services/eventService";
import { DataService } from "../services/dataService";
import {
  TIME_FILTERS,
  getDatePresets,
  getTimeFilterStrings,
} from "../utils/filterHelpers";
import { CustomDateRangePicker } from "../components/CustomDateRangePicker";

export const FilterScreen = () => {
  const {
    background,
    text,
    textMuted,
    primary,
    secondary,
    cardBackground,
    border,
  } = useTheme();
  const navigation = useNavigation();
  const {
    selectedCity,
    setAllGenres,
    setAllVenues,
    allGenres,
    allVenues,
    loadAllGenres,
    loadAllVenues,
  } = useUserPreferences();
  const {
    activeFilters,
    setFilters,
    clearFilters: clearStoreFilters,
  } = useFilterStore();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(
    null
  );
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>("");
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [venueSearchQuery, setVenueSearchQuery] = useState("");

  // Accordion states
  const [expandedTimeFilter, setExpandedTimeFilter] = useState(false);
  const [expandedDateFilter, setExpandedDateFilter] = useState(false);
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [expandedVenues, setExpandedVenues] = useState(false);

  // Filter genres and venues based on search
  const filteredGenres = allGenres.filter((genre) =>
    genre.name.toLowerCase().includes(genreSearchQuery.toLowerCase())
  );
  const filteredVenues = allVenues.filter((venue) =>
    venue.venue.toLowerCase().includes(venueSearchQuery.toLowerCase())
  );

  const datePresets = getDatePresets();

  useEffect(() => {
    loadFilterOptions();
    // Load previous filter values from store
    if (activeFilters) {
      if (activeFilters.genres && activeFilters.genres.length > 0) {
        setSelectedGenres(activeFilters.genres);
      }
      if (activeFilters.venues && activeFilters.venues.length > 0) {
        setSelectedVenues(activeFilters.venues);
      }
      if (activeFilters.timeFilter) {
        setSelectedTimeFilter(activeFilters.timeFilter);
      }
      if (activeFilters.datePreset) {
        setSelectedDatePreset(activeFilters.datePreset);
      }
      if (activeFilters.dateFrom) {
        setCustomDateFrom(new Date(activeFilters.dateFrom));
      }
      if (activeFilters.dateTo) {
        setCustomDateTo(new Date(activeFilters.dateTo));
      }
    }
  }, [selectedCity]);

  const loadFilterOptions = async () => {
    try {
      // Load categories and venues from store (which calls API with pagination)
      await Promise.all([
        loadAllGenres(selectedCity),
        loadAllVenues(selectedCity),
      ]);

      console.log(
        "🚀 ~ loadFilterOptions ~ genres:",
        allGenres.length,
        "venues:",
        allVenues.length
      );
    } catch (error) {
      console.error("Error loading filter options:", error);
      // Set empty arrays on error
      setAllGenres([]);
      setAllVenues([]);
    }
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  };

  const toggleVenue = (venueName: string) => {
    setSelectedVenues((prev) =>
      prev.includes(venueName)
        ? prev.filter((v) => v !== venueName)
        : [...prev, venueName]
    );
  };

  const handleApplyFilters = () => {
    // Get date range from preset if selected
    let dateFrom: string | undefined = undefined;
    let dateTo: string | undefined = undefined;

    if (selectedDatePreset && selectedDatePreset !== "custom") {
      const preset = datePresets.find((p) => p.value === selectedDatePreset);
      if (preset) {
        const range = preset.getDateRange();
        dateFrom = range.from;
        dateTo = range.to;
      }
    } else if (
      selectedDatePreset === "custom" &&
      customDateFrom &&
      customDateTo
    ) {
      dateFrom = customDateFrom.toISOString().split("T")[0];
      dateTo = customDateTo.toISOString().split("T")[0];
    }

    // Save filters to store
    setFilters({
      genres: selectedGenres,
      venues: selectedVenues,
      timeFilter: selectedTimeFilter || undefined,
      datePreset: selectedDatePreset,
      dateFrom,
      dateTo,
    });

    // Navigate back to Shows screen
    navigation.goBack();
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedVenues([]);
    setSelectedTimeFilter(null);
    setSelectedDatePreset("");
    setCustomDateFrom(null);
    setCustomDateTo(null);
    clearStoreFilters();
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedVenues.length > 0 ||
    selectedTimeFilter ||
    selectedDatePreset;

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: cardBackground,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color={text} strokeWidth={2.5} />
              </Pressable>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  fontFamily: FONT_FAMILY.poppinsBlack,
                  color: text,
                  letterSpacing: -0.5,
                }}
              >
                Filters
              </Text>
            </View>
            {hasActiveFilters && (
              <Pressable onPress={handleClearFilters}>
                <Text
                  style={{
                    fontSize: 14,
                    color: primary,
                    fontWeight: "700",
                    fontFamily: FONT_FAMILY.poppinsBold,
                  }}
                >
                  Clear All
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 120,
            }}
          >
            {/* Genres Accordion - FIRST */}
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: 20,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setExpandedGenres(!expandedGenres)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Music2
                    size={20}
                    color={primary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: text,
                      }}
                    >
                      Genres
                    </Text>
                    {!expandedGenres && selectedGenres.length > 0 && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: textMuted,
                          fontWeight: "600",
                          fontFamily: FONT_FAMILY.poppinsSemiBold,
                          marginTop: 4,
                        }}
                      >
                        {selectedGenres.length} selected
                      </Text>
                    )}
                  </View>
                </View>
                {selectedGenres.length > 0 && (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: primary + "20",
                      borderRadius: 10,
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: primary,
                      }}
                    >
                      {selectedGenres.length}
                    </Text>
                  </View>
                )}
                <View>
                  {expandedGenres ? (
                    <ChevronDown size={24} color={primary} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={24} color={primary} strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>

              {expandedGenres && (
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    borderTopWidth: 1,
                    borderTopColor: border,
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
                    <Search
                      size={18}
                      color={textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      placeholder="Search genres..."
                      placeholderTextColor={textMuted}
                      value={genreSearchQuery}
                      onChangeText={setGenreSearchQuery}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: text,
                        fontFamily: FONT_FAMILY.poppinsRegular,
                        textAlignVertical: "center",
                        paddingTop: 15,
                      }}
                    />
                    {genreSearchQuery.length > 0 && (
                      <Pressable
                        onPress={() => setGenreSearchQuery("")}
                        style={{ marginLeft: 8 }}
                      >
                        <X size={18} color={textMuted} />
                      </Pressable>
                    )}
                  </View>

                  {/* Genres List */}
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                  >
                    {filteredGenres.length > 0 ? (
                      filteredGenres.map((genre) => {
                        const decodedName = decodeHtmlEntities(genre.name);
                        const isSelected = selectedGenres.includes(genre.name);
                        return (
                          <Pressable
                            key={genre.id}
                            onPress={() => toggleGenre(genre.name)}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 18,
                              borderRadius: 14,
                              borderWidth: 1.5,
                              borderColor: isSelected ? primary : border,
                              backgroundColor: isSelected
                                ? primary + "20"
                                : "transparent",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                fontFamily: FONT_FAMILY.poppinsBold,
                                color: isSelected ? primary : text,
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
                        No genres found matching "{genreSearchQuery}"
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Venues Accordion - SECOND */}
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: 20,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setExpandedVenues(!expandedVenues)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <MapPin
                    size={20}
                    color={primary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: text,
                      }}
                    >
                      Venues
                    </Text>
                    {!expandedVenues && selectedVenues.length > 0 && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: textMuted,
                          fontWeight: "600",
                          fontFamily: FONT_FAMILY.poppinsSemiBold,
                          marginTop: 4,
                        }}
                      >
                        {selectedVenues.length} selected
                      </Text>
                    )}
                  </View>
                </View>
                {selectedVenues.length > 0 && (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: primary + "20",
                      borderRadius: 10,
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: primary,
                      }}
                    >
                      {selectedVenues.length}
                    </Text>
                  </View>
                )}
                <View>
                  {expandedVenues ? (
                    <ChevronDown size={24} color={primary} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={24} color={primary} strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>

              {expandedVenues && (
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    borderTopWidth: 1,
                    borderTopColor: border,
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
                    <Search
                      size={18}
                      color={textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      placeholder="Search venues..."
                      placeholderTextColor={textMuted}
                      value={venueSearchQuery}
                      onChangeText={setVenueSearchQuery}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: text,
                        fontFamily: FONT_FAMILY.poppinsRegular,
                        textAlignVertical: "center",
                        paddingTop: 15,
                      }}
                    />
                    {venueSearchQuery.length > 0 && (
                      <Pressable
                        onPress={() => setVenueSearchQuery("")}
                        style={{ marginLeft: 8 }}
                      >
                        <X size={18} color={textMuted} />
                      </Pressable>
                    )}
                  </View>

                  {/* Venues List */}
                  <View style={{ gap: 10 }}>
                    {filteredVenues.length > 0 ? (
                      filteredVenues.map((venue) => {
                        const decodedVenueName = decodeHtmlEntities(
                          venue.venue
                        );
                        const isSelected = selectedVenues.includes(venue.venue);
                        return (
                          <Pressable
                            key={venue.id}
                            onPress={() => toggleVenue(venue.venue)}
                            style={{
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderRadius: 14,
                              borderWidth: 1.5,
                              borderColor: isSelected ? primary : border,
                              backgroundColor: isSelected
                                ? primary + "20"
                                : "transparent",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "700",
                                  fontFamily: FONT_FAMILY.poppinsBold,
                                  color: isSelected ? primary : text,
                                  flex: 1,
                                }}
                              >
                                {decodedVenueName}
                              </Text>
                              <View
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 10,
                                  borderWidth: 2,
                                  borderColor: isSelected ? primary : border,
                                  backgroundColor: isSelected
                                    ? primary
                                    : "transparent",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isSelected && (
                                  <View
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 5,
                                      backgroundColor: "#FFFFFF",
                                    }}
                                  />
                                )}
                              </View>
                            </View>
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
                        No venues found matching "{venueSearchQuery}"
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Time Filter Accordion - THIRD */}
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: 20,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setExpandedTimeFilter(!expandedTimeFilter)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Clock
                    size={20}
                    color={primary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: text,
                      }}
                    >
                      Time of Day
                    </Text>
                    {!expandedTimeFilter && selectedTimeFilter && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: textMuted,
                          fontWeight: "600",
                          fontFamily: FONT_FAMILY.poppinsSemiBold,
                          marginTop: 4,
                        }}
                      >
                        {
                          TIME_FILTERS.find(
                            (t) => t.value === selectedTimeFilter
                          )?.label
                        }
                      </Text>
                    )}
                  </View>
                </View>
                <View>
                  {expandedTimeFilter ? (
                    <ChevronDown size={24} color={primary} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={24} color={primary} strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>

              {expandedTimeFilter && (
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    borderTopWidth: 1,
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
                    {TIME_FILTERS.map((timeFilter) => {
                      const isSelected =
                        selectedTimeFilter === timeFilter.value;
                      return (
                        <Pressable
                          key={timeFilter.value}
                          onPress={() =>
                            setSelectedTimeFilter(
                              isSelected ? "" : timeFilter.value
                            )
                          }
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 18,
                            borderRadius: 14,
                            borderWidth: 1.5,
                            borderColor: isSelected ? primary : border,
                            backgroundColor: isSelected
                              ? primary + "20"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              fontFamily: FONT_FAMILY.poppinsBold,
                              color: isSelected ? primary : text,
                            }}
                          >
                            {timeFilter.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Date Range Accordion - FOURTH */}
            <View
              style={{
                backgroundColor: cardBackground,
                borderRadius: 20,
                marginBottom: 16,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setExpandedDateFilter(!expandedDateFilter)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Calendar
                    size={20}
                    color={primary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        fontFamily: FONT_FAMILY.poppinsBlack,
                        color: text,
                      }}
                    >
                      Date Range
                    </Text>
                    {!expandedDateFilter && selectedDatePreset && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: textMuted,
                          fontWeight: "600",
                          fontFamily: FONT_FAMILY.poppinsSemiBold,
                          marginTop: 4,
                        }}
                      >
                        {selectedDatePreset === "custom" &&
                        customDateFrom &&
                        customDateTo
                          ? `${customDateFrom.toLocaleDateString()} - ${customDateTo.toLocaleDateString()}`
                          : datePresets.find(
                              (p) => p.value === selectedDatePreset
                            )?.label}
                      </Text>
                    )}
                  </View>
                </View>
                <View>
                  {expandedDateFilter ? (
                    <ChevronDown size={24} color={primary} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={24} color={primary} strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>

              {expandedDateFilter && (
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    borderTopWidth: 1,
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
                    {datePresets.map((preset) => {
                      const isSelected = selectedDatePreset === preset.value;
                      return (
                        <Pressable
                          key={preset.value}
                          onPress={() =>
                            setSelectedDatePreset(
                              isSelected ? "" : preset.value
                            )
                          }
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 18,
                            borderRadius: 14,
                            borderWidth: 1.5,
                            borderColor: isSelected ? primary : border,
                            backgroundColor: isSelected
                              ? primary + "20"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              fontFamily: FONT_FAMILY.poppinsBold,
                              color: isSelected ? primary : text,
                            }}
                          >
                            {preset.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {/* Custom Date Option */}
                    <Pressable
                      onPress={() => {
                        setSelectedDatePreset("custom");
                        setShowCustomDatePicker(true);
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor:
                          selectedDatePreset === "custom" ? primary : border,
                        backgroundColor:
                          selectedDatePreset === "custom"
                            ? primary + "20"
                            : "transparent",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Calendar
                        size={14}
                        color={selectedDatePreset === "custom" ? primary : text}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          fontFamily: FONT_FAMILY.poppinsBold,
                          color:
                            selectedDatePreset === "custom" ? primary : text,
                        }}
                      >
                        Custom
                      </Text>
                    </Pressable>
                  </View>

                  {/* Custom Date Picker */}
                  {selectedDatePreset === "custom" && (
                    <View
                      style={{
                        marginTop: 16,
                        padding: 16,
                        backgroundColor: background,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          fontFamily: FONT_FAMILY.poppinsBold,
                          color: text,
                          marginBottom: 12,
                        }}
                      >
                        Select date range
                      </Text>
                      <View style={{ gap: 12 }}>
                        <Pressable
                          onPress={() => setShowCustomDatePicker(true)}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            backgroundColor: cardBackground,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: border,
                          }}
                        >
                          <Text
                            style={{
                              color: customDateFrom ? text : textMuted,
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            From:{" "}
                            {customDateFrom
                              ? customDateFrom.toLocaleDateString()
                              : "Select date"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setShowCustomDatePicker(true)}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            backgroundColor: cardBackground,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: border,
                          }}
                        >
                          <Text
                            style={{
                              color: customDateTo ? text : textMuted,
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            To:{" "}
                            {customDateTo
                              ? customDateTo.toLocaleDateString()
                              : "Select date"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Date Picker Modal */}
              <CustomDateRangePicker
                visible={showCustomDatePicker}
                onClose={() => setShowCustomDatePicker(false)}
                onApply={(startDate, endDate) => {
                  setCustomDateFrom(startDate);
                  setCustomDateTo(endDate);
                  setShowCustomDatePicker(false);
                }}
                initialStartDate={customDateFrom}
                initialEndDate={customDateTo}
                theme={{ primary, background, text, cardBackground }}
              />
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 24,
              paddingVertical: 20,
              backgroundColor: background,
              borderTopWidth: 1,
              borderTopColor: border,
            }}
          >
            <SafeAreaView edges={["bottom"]}>
              <Pressable
                onPress={handleApplyFilters}
                style={{ borderRadius: 16, overflow: "hidden" }}
              >
                <View
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    backgroundColor: "#f2a41e",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "800",
                      letterSpacing: 0.5,
                    }}
                  >
                    {hasActiveFilters ? `Apply Filters` : "Show All Shows"}
                  </Text>
                </View>
              </Pressable>
            </SafeAreaView>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};
