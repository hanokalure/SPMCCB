import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';

interface FloatingButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  onPress,
  position = 'bottom-right',
  size = 56,
  backgroundColor,
  iconColor,
}) => {
  const { settings } = useOffline();

  // Enhanced sizing for web
  const actualSize = Platform.OS === 'web' ? size + 8 : size; // Larger buttons on web
  
  // Default colors based on theme
  const defaultBackgroundColor = backgroundColor || (settings.theme === 'light' ? '#3182ce' : '#63b3ed');
  const defaultIconColor = iconColor || 'white';

  // Position styles with enhanced web positioning
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
    };

    // Enhanced positioning for web
    if (Platform.OS === 'web') {
      switch (position) {
        case 'bottom-right':
          return { ...baseStyle, bottom: 30, right: 30 };
        case 'bottom-left':
          return { ...baseStyle, bottom: 30, left: 30 };
        case 'top-right':
          return { ...baseStyle, top: 30, right: 30 };
        case 'top-left':
          return { ...baseStyle, top: 30, left: 30 };
        default:
          return { ...baseStyle, bottom: 30, right: 30 };
      }
    }

    // Mobile positioning
    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 20, left: 20 };
      case 'top-right':
        return { ...baseStyle, top: 20, right: 20 };
      case 'top-left':
        return { ...baseStyle, top: 20, left: 20 };
      default:
        return { ...baseStyle, bottom: 20, right: 20 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getPositionStyle(),
        {
          width: actualSize,
          height: actualSize,
          borderRadius: actualSize / 2,
          backgroundColor: defaultBackgroundColor,
          cursor: Platform.OS === 'web' ? 'pointer' : 'default', // Web cursor
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon}
        size={actualSize * 0.4}
        color={defaultIconColor}
      />
    </TouchableOpacity>
  );
};


// Specialized heart button for favourites
interface HeartButtonProps {
  isFavourite: boolean;
  onToggle: () => void;
}

export const HeartButton: React.FC<HeartButtonProps> = ({ isFavourite, onToggle }) => {
  return (
    <FloatingButton
      icon={isFavourite ? 'heart' : 'heart-outline'}
      onPress={onToggle}
      position="bottom-left"
      backgroundColor={isFavourite ? '#e53e3e' : '#718096'}
    />
  );
};

// Specialized folder button for adding songs to folders
interface FolderButtonProps {
  onPress: () => void;
}

export const FolderButton: React.FC<FolderButtonProps> = ({ onPress }) => {
  const { settings } = useOffline();
  
  return (
    <FloatingButton
      icon="folder-outline"
      onPress={onPress}
      size={50} // Slightly smaller than other buttons
      backgroundColor={settings.theme === 'light' ? '#805ad5' : '#b794f6'}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
});

export default FloatingButton;
