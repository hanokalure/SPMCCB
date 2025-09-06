import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useOffline } from '../contexts/OfflineContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, AuthStackParamList } from '../constants/Config';

// Import navigation and screens
import BottomTabs from './BottomTabs';
import LyricsScreen from '../screens/LyricsScreen';
import FolderDetailScreen from '../screens/FolderDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

// Auth Navigator for login/signup screens
const AuthNavigator: React.FC = () => {
  const { settings } = useOffline();
  
  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
    active: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
  };

  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: colors.background,
        },
        gestureEnabled: true,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// Wrapper component to manage authentication flow
const NavigationWithAuth: React.FC = () => {
  const { user, isLoading } = useAuth();

  console.log('🚀 Navigation: User status:', user ? 'Authenticated' : 'Not authenticated', 'Loading:', isLoading);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* This will be handled by the main loading screen in App.tsx */}
      </View>
    );
  }

  // Show auth navigator if user is not logged in, otherwise show main app
  return user ? <MainNavigator /> : <AuthNavigator />;
};

// Main app navigator (protected routes)
const MainNavigator: React.FC = () => {
  const { settings } = useOffline();

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
    active: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
  };

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
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
          color: colors.text || '#2d3748',
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        
        // Card styling
        cardStyle: {
          backgroundColor: colors.background,
        },
        
        // Animation configuration
        gestureEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      {/* Main tab navigator - defaults to Songs tab */}
      <Stack.Screen 
        name="Main" 
        component={BottomTabs}
        options={{
          headerShown: false,
        }}
      />
      
      {/* Lyrics screen */}
      <Stack.Screen 
        name="Lyrics" 
        component={LyricsScreen}
        options={{
          headerShown: true,
          title: 'Song Lyrics',
          headerBackTitle: 'Back',
        }}
      />
      
      {/* Folder detail screen */}
      <Stack.Screen 
        name="FolderDetail" 
        component={FolderDetailScreen}
        options={{
          headerShown: true,
          title: 'Folder Contents',
          headerBackTitle: 'Folders',
        }}
      />
      
      {/* Profile screen */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};


export default NavigationWithAuth;
