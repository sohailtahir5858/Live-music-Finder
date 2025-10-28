import React from 'react';
import {Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from '../contexts/ThemeContext';
import { Music2, Heart, User } from 'lucide-react-native';
import { ShowsScreen } from '../screens/ShowsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define tab types explicitly - 3 tabs only
export type MainTabsParamList = {
  Shows: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Main tab navigator - completely driven by config
export const MainTabNavigator = () => {
    const {
        tabBarBackground,
        tabBarActiveIcon,
        tabBarInactiveIcon,
        tabBarBorder,
        tabBarBorderTopWidth,
        tabBarIconSize,
        tabBarLabelFontSize
    } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: tabBarActiveIcon,
                tabBarInactiveTintColor: tabBarInactiveIcon,
                tabBarStyle: {
                    backgroundColor: tabBarBackground,
                    borderTopColor: tabBarBorder,
                    height: Platform.OS === 'ios' ? 72 : 60,
                    paddingBottom: 8,
                    borderTopWidth: tabBarBorderTopWidth,
                    elevation: 0,
                    shadowOpacity: 0,
                    // Ensure tab bar doesn't overlap with bottom notch
                    ...(Platform.OS === 'ios' ? {paddingBottom: 0} : {}),
                },
                tabBarLabelStyle: {
                    fontSize: tabBarLabelFontSize,
                    fontWeight: '500',
                }
            }}
        >
            <Tab.Screen
                name="Shows"
                component={ShowsScreen}
                options={{
                    tabBarLabel: 'Shows',
                    tabBarIcon: ({color}) => <Music2 size={tabBarIconSize} color={color} />
                }}
            />
            
            <Tab.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{
                    tabBarLabel: 'My Feed',
                    tabBarIcon: ({color}) => <Heart size={tabBarIconSize} color={color} />
                }}
            />
            
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({color}) => <User size={tabBarIconSize} color={color} />
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
