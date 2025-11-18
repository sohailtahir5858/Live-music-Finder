import React, { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import * as SplashScreen from "expo-splash-screen";

import { initialize } from "./magically/init";
import { createNavigationLogger } from "./magically/utils/NavigationLogger";
import { loadCustomFonts } from "./utils/fontConfig";

initialize();

import RootNavigator from "./navigation/RootNavigator";
import { MagicallyAlertComponent } from "./components/ui";
import { ThemeProvider, useTheme, useThemeMode } from "./contexts/ThemeContext";
import { useUserPreferences } from "./stores/userPreferencesStore";

/**
 * Do not add navigation stack here. Add it in the navigation folder.
 */
function AppContent() {
  const { background, cardBackground, text, border, primary, statusBarStyle } =
    useTheme();
  const { themeMode } = useThemeMode();
  const { selectedCity, loadAllGenres, loadAllVenues } = useUserPreferences();

  // Preload categories and venues data on app start
  useEffect(() => {
    const preloadData = async () => {
      try {
        await Promise.all([
          loadAllGenres(selectedCity),
          loadAllVenues(selectedCity),
        ]);
        console.log("[App] Preloaded genres and venues data");
      } catch (error) {
        console.error("[App] Error preloading data:", error);
      }
    };

    preloadData();
  }, [selectedCity, loadAllGenres, loadAllVenues]);

  // Always extend the base theme from react.navigation.
  // Otherwise, error such as cannot read property 'n.medium' of undefined will occur which basically means the fonts property is missing from the theme.
  const navigationTheme = {
    ...(themeMode === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeMode === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: background,
      card: cardBackground,
      text: text,
      border: border,
      primary: primary,
    },
  };

  return (
    <NavigationContainer
      theme={navigationTheme}
      onStateChange={createNavigationLogger()}
    >
      <StatusBar style={statusBarStyle === "light" ? "light" : "dark"} />
      <Toaster theme={themeMode} richColors />
      <>
        {/* DO NOT REMOVE the magically alert component. Otherwise alerts will not show up.*/}
      </>
      <MagicallyAlertComponent />
      {/* DO NOT REMOVE the magically alert component. Otherwise alerts will not show up.*/}
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep splash screen visible while loading fonts
        await SplashScreen.preventAutoHideAsync();
        
        // Load custom fonts
        const fontLoaded = await loadCustomFonts();
        
        if (fontLoaded) {
          setFontsLoaded(true);
        } else {
          // Even if font loading fails, we continue with system fonts
          setFontsLoaded(true);
        }
      } catch (e) {
        console.warn('[App] Error preparing app:', e);
        setFontsLoaded(true);
      } finally {
        // Hide splash screen after fonts are loaded
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
         <GestureHandlerRootView>
           <AppContent />
         </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
