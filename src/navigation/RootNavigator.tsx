import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import magically from 'magically-sdk';
import { Skeleton } from '../components/ui';
import LoginScreen from '../screens/LoginScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ShowDetailScreen } from '../screens/ShowDetailScreen';
import { FilterScreen } from '../screens/FilterScreen';
import MainTabNavigator from './MainTabNavigator';
import { useAppStateStore } from '../stores/appStateStore';
import { useUserPreferences } from '../stores/userPreferencesStore';

export type RootStackParamList = {
  Login: undefined;
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
  const [isAuthInitialized, setIsAuthInitialized] = React.useState(false);

  // First effect: Initialize and restore session on app start
  React.useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if there's a valid session already
        const isAuth = magically.auth.isAuthenticated;
        console.log('[Auth] Session check:', isAuth);
        updateState({ isAuthenticated: isAuth });
        
        // If authenticated, load preferences
        if (isAuth) {
          console.log('[Auth] Loading preferences for authenticated user');
          await loadPreferences();
        }
      } catch (error) {
        console.error('[Auth] Error restoring session:', error);
      } finally {
        setIsAuthInitialized(true);
      }
    };

    restoreSession();
  }, []);

  // Second effect: Set up auth state listener after initialization
  React.useEffect(() => {
    if (!isAuthInitialized) return;

    console.log('[Auth] Setting up auth listener');
    const unsubscribe = magically.auth.onAuthStateChanged((authState) => {
      console.log('[Auth] Auth state changed:', authState.isAuthenticated);
      updateState({ isAuthenticated: authState.isAuthenticated });
      
      // When user logs in, load preferences
      if (authState.isAuthenticated) {
        console.log('[Auth] User logged in, loading preferences');
        loadPreferences();
      } else {
        console.log('[Auth] User logged out');
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth listener');
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthInitialized]);

  // Show loading screen while auth is initializing
  if (!isAuthInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <Skeleton width={100} height={100} style={{ borderRadius: 50 }} />
      </View>
    );
  }

  // IMPORTANT: Add more conditions here as needed for your app
  // Example: const needsOnboarding = useAppStateStore(state => state.needsOnboarding);
  // Then use: !isAuthenticated ? (...) : needsOnboarding ? (...) : (...)
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated || !hasSelectedCity ? (
        // Auth flow: Login (includes city selection for authenticated users)
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
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