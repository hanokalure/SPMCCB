import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../constants/Config';
import { useOffline } from '../contexts/OfflineContext';
import { useSupabase } from '../hooks/useSupabase';

interface SongCardProps {
  song: Song;
  onPress: (song: Song) => void;
  showFavouriteButton?: boolean;
  showNumber?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  onPress,
  showFavouriteButton = true,
  showNumber = true,
}) => {
  const { settings } = useOffline();
  const { isFavourite, addFavourite, removeFavourite } = useSupabase();
  
  const isCurrentlyFavourite = isFavourite(song.id);

  // Theme colors based on light/dark mode
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    border: settings.theme === 'light' ? '#e2e8f0' : '#2d3748',
    primaryText: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    secondaryText: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
    heart: isCurrentlyFavourite ? '#e53e3e' : (settings.theme === 'light' ? '#cbd5e0' : '#4a5568'),
  };

  const handleFavouriteToggle = async () => {
    try {
      if (isCurrentlyFavourite) {
        await removeFavourite(song.id);
      } else {
        await addFavourite(song.id);
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onPress(song)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.songInfo}>
          {showNumber && (
            <View style={[styles.numberContainer, { backgroundColor: colors.accent }]}>
              <Text style={[styles.number, { color: 'white' }]}>
                {song.song_number}
              </Text>
            </View>
          )}
          
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.primaryText,
                  fontSize: Math.max(settings?.fontSize || 16, 12),
                  lineHeight: Math.max(settings?.fontSize || 16, 12) * 1.3, // Dynamic line height
                },
              ]}
              numberOfLines={3} // Increased to allow more text
            >
              {song.title}
            </Text>
          </View>
        </View>

        {showFavouriteButton && (
          <TouchableOpacity
            style={styles.favouriteButton}
            onPress={handleFavouriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isCurrentlyFavourite ? 'heart' : 'heart-outline'}
              size={22} // Slightly smaller for more space
              color={colors.heart}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
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
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Reduced from 16 to 8
    minHeight: 60, // Minimum height for small fonts
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberContainer: {
    width: 36, // Reduced from 40 to 36
    height: 36, // Reduced from 40 to 36
    borderRadius: 18, // Adjusted for new size
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // Further reduced margin
  },
  number: {
    fontSize: 14, // Reduced from 16 to 14
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginRight: 2, // Further reduced margin
    paddingVertical: 2, // Minimal vertical padding
  },
  title: {
    fontWeight: '600',
    marginBottom: 2, // Reduced from 4 to 2
    flexWrap: 'wrap',
    textAlignVertical: 'center', // Center text vertically
  },
  preview: {
    lineHeight: 18,
    opacity: 0.8,
  },
  favouriteButton: {
    padding: 6, // Reduced padding
    marginLeft: 4, // Reduced margin for more title space
  },
});

export default SongCard;
