import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';

interface WebToolbarProps {
  isFavourite: boolean;
  onFavoriteToggle: () => void;
  onAddToFolder: () => void;
  onBackPress?: () => void;
  songTitle?: string;
}

const WebToolbar: React.FC<WebToolbarProps> = ({
  isFavourite,
  onFavoriteToggle,
  onAddToFolder,
  onBackPress,
  songTitle = '',
}) => {
  const { settings } = useOffline();

  // Only render on web platform
  if (Platform.OS !== 'web') {
    return null;
  }

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    border: settings.theme === 'light' ? '#e2e8f0' : '#2d3748',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
    success: settings.theme === 'light' ? '#38a169' : '#68d391',
    danger: settings.theme === 'light' ? '#e53e3e' : '#fc8181',
    purple: settings.theme === 'light' ? '#805ad5' : '#b794f6',
  };

  const ToolbarButton = ({ 
    icon, 
    onPress, 
    active = false, 
    color, 
    label,
    activeColor 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    active?: boolean;
    color?: string;
    label: string;
    activeColor?: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.toolbarButton,
        {
          backgroundColor: active 
            ? (activeColor || colors.accent) + '20' 
            : 'transparent',
          borderColor: active 
            ? (activeColor || colors.accent) 
            : colors.border,
        }
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? (activeColor || colors.accent) : (color || colors.text)}
      />
      <Text
        style={[
          styles.toolbarButtonText,
          {
            color: active ? (activeColor || colors.accent) : (color || colors.text),
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.toolbar, 
      { 
        backgroundColor: settings.theme === 'light' 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(26, 32, 44, 0.95)',
        borderColor: colors.border 
      }
    ]}>
      <View style={styles.toolbarLeft}>
        {onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.toolbarSection}>
        <Text style={[styles.songInfo, { color: colors.text }]}>
          {songTitle && songTitle.length > 50 ? `${songTitle.substring(0, 50)}...` : songTitle}
        </Text>
      </View>

      <View style={styles.toolbarActions}>
        <ToolbarButton
          icon={isFavourite ? 'heart' : 'heart-outline'}
          onPress={onFavoriteToggle}
          active={isFavourite}
          activeColor={colors.danger}
          label="Favorite"
        />

        <ToolbarButton
          icon="folder-outline"
          onPress={onAddToFolder}
          color={colors.purple}
          label="Add to Folder"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  toolbarLeft: {
    minWidth: 40,
    justifyContent: 'flex-start',
  },
  toolbarSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  songInfo: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    gap: 6,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WebToolbar;
