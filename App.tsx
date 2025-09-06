import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OfflineProvider, useOffline } from './contexts/OfflineContext';

// Navigation
import StackNavigator from './navigation/StackNavigator';

// Components

// App configuration
import { APP_CONFIG } from './constants/Config';

// Loading screen component
const LoadingScreen: React.FC = () => {
  const { settings } = useOffline();
  
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
  };

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.appTitle, { color: colors.text, fontSize: Math.max((settings?.fontSize || 16) + 8, 20) }]}>
        🎵 {APP_CONFIG.name}
      </Text>
      <Text style={[styles.loadingText, { color: colors.accent, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
        Initializing app...
      </Text>
      <Text style={[styles.versionText, { color: colors.text, fontSize: Math.max((settings?.fontSize || 16) - 2, 10) }]}>
        Version {APP_CONFIG.version}
      </Text>
    </View>
  );
};

// Main app content
const AppContent: React.FC = () => {
  const { settings } = useOffline();

  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
  };

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          style={settings.theme === 'light' ? 'dark' : 'light'} 
        />
        
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
};

// Root app component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <OfflineProvider>
        <AppWrapper />
      </OfflineProvider>
    </AuthProvider>
  );
};

// App wrapper to handle loading states
const AppWrapper: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { settings, lastSync } = useOffline();
  const [isAppReady, setIsAppReady] = React.useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for auth to be ready
        if (authLoading) return;
        
        // Add any additional initialization here
        // For example, check for app updates, sync data, etc.
        
        // Small delay to show loading screen
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Even if there's an error, we should still show the app
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, [authLoading]);

  // Show loading screen while app is initializing
  if (!isAppReady || authLoading) {
    return <LoadingScreen />;
  }

  // Show main app
  return <AppContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  appTitle: {
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontWeight: '500',
    marginBottom: 8,
  },
  versionText: {
    opacity: 0.7,
  },
});

export default App;
