import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { BottomTabParamList } from '../constants/Config';
import { useNavigation } from '@react-navigation/native';

// Import screens
import SongsScreen from '../screens/SongsScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import FoldersScreen from '../screens/FoldersScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabs: React.FC = () => {
  const { settings } = useOffline();
  const navigation = useNavigation<any>();

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    tabBar: settings.theme === 'light' ? '#f8f9fa' : '#2d3748',
    active: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
    inactive: settings.theme === 'light' ? '#a0aec0' : '#718096',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Tab bar icons
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Songs':
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              break;
            case 'Favourites':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Folders':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // Tab bar styling
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 30 : 18,
          height: Platform.OS === 'ios' ? 95 : 80,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: Math.max(10, (settings?.fontSize || 16) - 6),
          fontWeight: '500',
          marginBottom: 4,
        },

        // Header styling
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.active,
        headerTitleStyle: {
          fontSize: Math.min(18, (settings?.fontSize || 16) + 2),
          fontWeight: '600',
          color: settings?.theme === 'light' ? '#2d3748' : '#f7fafc',
        },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity
            style={{
              marginRight: 16,
              padding: 8,
              borderRadius: 22,
            }}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons 
              name="person-circle-outline" 
              size={32} 
              color={colors.active} 
            />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen 
        name="Songs" 
        component={SongsScreen}
        options={{
          title: 'All Songs',
          tabBarLabel: 'Songs',
        }}
      />
      
      <Tab.Screen 
        name="Favourites" 
        component={FavouritesScreen}
        options={{
          title: 'My Favourites',
          tabBarLabel: 'Favourites',
        }}
      />
      
      <Tab.Screen 
        name="Folders" 
        component={FoldersScreen}
        options={{
          title: 'My Folders',
          tabBarLabel: 'Folders',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
