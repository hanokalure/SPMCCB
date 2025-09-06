import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../constants/Config';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { settings, toggleTheme, updateFontSize } = useOffline();
  const { user, signOut } = useAuth();

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    cardBackground: settings.theme === 'light' ? '#f7fafc' : '#2d3748',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
  };

  const handleFontSizeChange = (newSize: number) => {
    updateFontSize(newSize);
  };

  const currentFontSize = Math.max(settings?.fontSize || 16, 12);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your favorites and folders will be synced when you sign back in.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('✅ User signed out successfully');
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
          Manage your account and preferences
        </Text>
      </View>

      {/* Account Settings - First Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        
        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <View style={[styles.userAvatar, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="person" size={24} color={colors.accent} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userEmail, { color: colors.text }]}>
              {user?.email || 'Not signed in'}
            </Text>
            <Text style={[styles.userStatus, { color: colors.subText }]}>
              Signed in • Synced with cloud
            </Text>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.signOutButton,
            {
              backgroundColor: 'transparent',
              borderColor: '#e53e3e',
            },
          ]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
          <Text style={[styles.signOutButtonText, { color: '#e53e3e' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appearance Settings */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.settingDescription, { color: colors.subText }]}>
              Switch between light and dark mode
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={toggleTheme}
          >
            <Text style={[styles.themeButtonText, { color: '#ffffff' }]}>
              {settings.theme === 'light' ? '🌙' : '☀️'} {settings.theme}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Font Settings */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Text</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Font Size</Text>
            <Text style={[styles.settingDescription, { color: colors.subText }]}>
              Adjust text size for better readability
            </Text>
          </View>
          
          <View style={styles.fontControls}>
            {/* Font Size Display */}
            <View style={[
              styles.fontSizeDisplay,
              {
                backgroundColor: colors.accent + '15',
                borderColor: colors.accent + '30',
              }
            ]}>
              <Text style={[styles.fontSizeText, { color: colors.accent }]}>
                {Math.round(currentFontSize)}px
              </Text>
            </View>
            
            {/* Font Control Buttons */}
            <View style={styles.fontButtons}>
              {/* Decrease Font Size Button */}
              <TouchableOpacity
                style={[
                  styles.fontButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => handleFontSizeChange(Math.max(currentFontSize - 2, 12))}
                disabled={currentFontSize <= 12}
              >
                <Text style={[styles.fontButtonText, { 
                  color: currentFontSize <= 12 ? colors.subText : colors.accent 
                }]}>
                  A-
                </Text>
              </TouchableOpacity>
              
              {/* Increase Font Size Button */}
              <TouchableOpacity
                style={[
                  styles.fontButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => handleFontSizeChange(Math.min(currentFontSize + 2, 32))}
                disabled={currentFontSize >= 32}
              >
                <Text style={[styles.fontButtonText, { 
                  color: currentFontSize >= 32 ? colors.subText : colors.accent 
                }]}>
                  A+
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Quick Size Presets */}
        <View style={styles.presetsRow}>
          <Text style={[styles.presetsLabel, { color: colors.subText }]}>Quick sizes:</Text>
          <View style={styles.presetsContainer}>
            {[12, 14, 16, 18, 20, 24].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: currentFontSize === size ? colors.accent : 'transparent',
                    borderColor: colors.accent + '50',
                  },
                ]}
                onPress={() => handleFontSizeChange(size)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    {
                      color: currentFontSize === size ? '#ffffff' : colors.accent,
                    },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        
        <View style={styles.appInfoRow}>
          <Text style={[styles.appName, { color: colors.text }]}>
            🎵 {APP_CONFIG.name}
          </Text>
          <Text style={[styles.appVersion, { color: colors.subText }]}>
            Version {APP_CONFIG.version}
          </Text>
        </View>
        
        <View style={styles.developerNote}>
          <Text style={[styles.developerText, { color: colors.subText }]}>
            Developed by
          </Text>
          <Text style={[styles.developerName, { color: colors.accent }]}>
            MYF North Bidar
          </Text>
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  fontControls: {
    alignItems: 'center',
  },
  fontSizeDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    marginBottom: 8,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fontButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  fontButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetsRow: {
    marginTop: 8,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    width: 36,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f020',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
    fontWeight: '400',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfoRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
  developerNote: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f040',
  },
  developerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;
