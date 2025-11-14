import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../contexts/ThemeContext";
import { Logo } from "../components/ui/Logo";
import { Mail, Loader2 } from "lucide-react-native";
import magically from "magically-sdk";
import { ImageBackground } from "expo-image";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const stageGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Faster and more prominent pulse (1.5s cycle, scale to 1.15)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Faster glow animation for more prominent effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(stageGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(stageGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const triggerAuth = async (provider: "google" | "apple" | "email") => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await magically.auth.triggerAuthenticationFlow(provider);
      // Authentication success will be handled by the auth state listener in RootNavigator
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const AuthButton = ({
    onPress,
    icon,
    label,
    provider,
    bgColor,
    textColor,
    borderColor,
  }: {
    onPress: () => void;
    icon?: any;
    label: string;
    provider: string;
    bgColor: string;
    textColor: string;
    borderColor?: string;
  }) => {
    const buttonScale = useRef(new Animated.Value(1)).current;
    const isCurrentLoading = isLoading && loadingProvider === provider;

    const handlePressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            backgroundColor: bgColor,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: borderColor ? 1 : 0,
            borderColor: borderColor || "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {isCurrentLoading ? (
            <Loader2 size={24} color={textColor} style={{ marginRight: 12 }} />
          ) : icon ? (
            <View style={{ marginRight: 12 }}>{icon}</View>
          ) : null}
          <Text
            style={{
              color: textColor,
              fontSize: 17,
              fontWeight: "600",
              letterSpacing: 0.3,
            }}
          >
            {isCurrentLoading ? "Connecting..." : label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const glowOpacity = stageGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9], // More prominent glow
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBarStyle === "light" ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ImageBackground
              style={{
                width: "100%",
                height: "100%",
                paddingHorizontal: 24,
              }}
              source={require("../../assets/images/Live-Music.webp")}
            >
              <Animated.View
                style={{
                  flex: 1,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  minHeight: height - 100,
                  justifyContent: "space-between",
                  paddingTop: 60,
                }}
              >
                <View style={{ alignItems: "center", marginBottom: 40 }}>
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      marginBottom: 32,
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Pulsing shadow layer 1 */}
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: 130,
                        height: 130,
                        borderRadius: 30,
                        backgroundColor: theme.primary,
                        opacity: glowOpacity.interpolate({
                          inputRange: [0.4, 0.9],
                          outputRange: [0.15, 0.35],
                        }),
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [1, 1.15],
                              outputRange: [1, 1.1],
                            }),
                          },
                        ],
                      }}
                    />

                    {/* Pulsing shadow layer 2 */}
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: 130,
                        height: 130,
                        borderRadius: 30,
                        backgroundColor: theme.primary,
                        opacity: stageGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.5],
                        }),
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [1, 1.15],
                              outputRange: [1, 1.1],
                            }),
                          },
                        ],
                      }}
                    />

                    {/* Logo container with strong shadow */}
                    <Animated.View
                      style={{
                        width: 130,
                        height: 130,
                        borderRadius: 30,
                        backgroundColor: theme.cardBackground,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 3,
                        borderColor: theme.primary,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    >
                      <Logo size={100} />
                    </Animated.View>
                  </Animated.View>

                  <Animated.View style={{ opacity: 1 }}>
                    <Text
                      style={{
                        fontSize: 36,
                        fontFamily: theme.fontFamilyBold,
                        color: theme.text,
                        marginBottom: 12,
                        textAlign: "center",
                        letterSpacing: -0.5,
                      }}
                    >
                      Live Music Local
                    </Text>
                  </Animated.View>

                  <Text
                    style={{
                      fontSize: 17,
                      fontFamily: theme.fontFamily,
                      color: theme.textMuted,
                      textAlign: "center",
                      lineHeight: 24,
                      paddingHorizontal: 20,
                      marginBottom: 8,
                    }}
                  >
                   One app. Every show.
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 16,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      backgroundColor: theme.primary + "15",
                      borderRadius: 20,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.primary,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.primary,
                        letterSpacing: 0.3,
                        fontFamily: theme.fontFamilySemiBold,
                      }}
                    >
                      Your backstage pass to local shows
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 16, marginTop: 40 }}>
                  <AuthButton
                    onPress={() => triggerAuth("google")}
                    icon={
                      <Image
                        source={{
                          uri: "https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/google.png",
                        }}
                        style={{ width: 24, height: 24 }}
                        resizeMode="contain"
                      />
                    }
                    label="Continue with Google"
                    provider="google"
                    bgColor={theme.cardBackground}
                    textColor={theme.text}
                    borderColor={theme.border}
                  />

                  {Platform.OS == "ios" && (
                    <AuthButton
                      onPress={() => triggerAuth("apple")}
                      icon={
                        <Image
                          source={{
                            uri: "https://yrsdqwemtqgdwoixrrge.supabase.co/storage/v1/object/public/assets/icons/apple.png",
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            tintColor: "black",
                          }}
                          resizeMode="contain"
                        />
                      }
                      label="Continue with Apple"
                      provider="apple"
                      bgColor={theme.text}
                      textColor={theme.background}
                    />
                  )}

                  <AuthButton
                    onPress={() => triggerAuth("email")}
                    icon={<Mail size={24} color={theme.primaryForeground} />}
                    label="Continue with Email"
                    provider="email"
                    bgColor={theme.primary}
                    textColor={theme.primaryForeground}
                  />

                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.textLight,
                      textAlign: "center",
                      marginTop: 24,
                      lineHeight: 20,
                      paddingHorizontal: 32,
                    }}
                  >
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </Text>
                </View>
              </Animated.View>
            </ImageBackground>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}
