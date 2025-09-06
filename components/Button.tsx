import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  backgroundColor,
  textColor,
}) => {
  const { settings } = useOffline();

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: settings.fontSize - 2,
      iconSize: 16,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: settings.fontSize,
      iconSize: 18,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: settings.fontSize + 2,
      iconSize: 20,
    },
  };

  const currentSize = sizeConfig[size];

  // Theme-based colors
  const getVariantStyles = () => {
    const isLight = settings.theme === 'light';
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: backgroundColor || (isLight ? '#3182ce' : '#63b3ed'),
          color: textColor || 'white',
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: backgroundColor || (isLight ? '#e2e8f0' : '#4a5568'),
          color: textColor || (isLight ? '#2d3748' : '#f7fafc'),
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: textColor || (isLight ? '#3182ce' : '#63b3ed'),
          borderWidth: 1,
          borderColor: backgroundColor || (isLight ? '#3182ce' : '#63b3ed'),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: textColor || (isLight ? '#3182ce' : '#63b3ed'),
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: backgroundColor || (isLight ? '#3182ce' : '#63b3ed'),
          color: textColor || 'white',
          borderWidth: 0,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      onPress();
    }
  };

  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null;
    
    return (
      <Ionicons
        name={icon}
        size={currentSize.iconSize}
        color={variantStyles.color}
        style={[
          position === 'left' ? styles.iconLeft : styles.iconRight,
        ]}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.color}
        />
      );
    }

    return (
      <>
        {renderIcon('left')}
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.color,
              fontSize: currentSize.fontSize,
            },
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
        {renderIcon('right')}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth || 0,
          borderColor: variantStyles.borderColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
      },
    }),
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
