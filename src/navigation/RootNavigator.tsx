import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import magically from 'magically-sdk';
import { Skeleton } from '../components/ui';
import LoginScreen from '../screens/LoginScreen';
import CitySelectionScreen from '../screens/CitySelectionScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { FilterScreen } from '../screens/FilterScreen';
import MainTabNavigator from './MainTabNavigator';
import { useAppStateStore } from '../stores/appStateStore';
import { useUserPreferences } from '../stores/userPreferencesStore';

export type RootStackParamList = {
  Login: undefined;
  CitySelection: undefined;
  MainTabs: undefined;
  Feedback: undefined;
  Profile: undefined;
  ShowDetail: { showId: string };
  Filter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  // REACTIVE PATTERN: Navigator reacts to state changes
  // Screens update stores -> Stores update state -> Navigator re-renders
  const isAuthenticated = useAppStateStore((state) => state.isAuthenticated);
  const updateState = useAppStateStore((state) => state.updateState);
  const { loadPreferences, hasLoadedPreferences, hasSelectedCity } = useUserPreferences();

  useEffect(() => {
    // Initialize auth state from SDK
    updateState({ isAuthenticated: magically.auth.isAuthenticated });

    // Listen for auth state changes and update store
    const unsubscribe = magically.auth.onAuthStateChanged((authState) => {
      updateState({ isAuthenticated: authState.isAuthenticated });
      if (authState.isAuthenticated && !hasLoadedPreferences) {
        loadPreferences();
      }
    });

    return unsubscribe;
  }, [updateState, loadPreferences, hasLoadedPreferences]);

  // IMPORTANT: Add more conditions here as needed for your app
  // Example: const needsOnboarding = useAppStateStore(state => state.needsOnboarding);
  // Then use: !isAuthenticated ? (...) : needsOnboarding ? (...) : (...)
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth flow: Login
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : !hasSelectedCity ? (
        // First time: City selection
        <>
          <Stack.Screen name="CitySelection" component={CitySelectionScreen} />
        </>
      ) : (
        // Authenticated with city selected: Show main app
        <>
          {/* TABS SCREEN - Shows bottom tabs */}
          {/* Please remove if tabs are not needed */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          
          {/* DETAIL SCREENS - These hide the tabs automatically */}
          <Stack.Screen name="Feedback" component={FeedbackScreen}/>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ShowDetail" component={ShowDetailScreen} />
          <Stack.Screen name="Filter" component={FilterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;