import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Song } from '../constants/Config';
import { useSupabase } from '../hooks/useSupabase';
import { useOffline } from '../contexts/OfflineContext';
import { HeartButton, FolderButton } from '../components/FloatingButton';
import WebToolbar from '../components/WebToolbar';
import Button from '../components/Button';

interface LyricsScreenProps {
  route: {
    params: {
      song: Song;
    };
  };
  navigation: any;
}

const LyricsScreen: React.FC<LyricsScreenProps> = ({ route, navigation }) => {
  const { song } = route.params;
  const { 
    isFavourite, 
    addFavourite, 
    removeFavourite, 
    fetchFolders, 
    addSongToFolder 
  } = useSupabase();
  const { settings, isOffline } = useOffline();
  
  const isCurrentlyFavourite = isFavourite(song.id);
  
  // Get current font size from settings
  const currentFontSize = Math.max(settings?.fontSize || 16, 12);

  // Set navigation title - Hide on web since we use WebToolbar
  useEffect(() => {
    if (Platform.OS === 'web') {
      navigation.setOptions({
        headerShown: false, // Hide default header on web
      });
    } else {
      navigation.setOptions({
        title: `${song.song_number} - ${song.title}`,
        headerTitleStyle: {
          fontSize: Math.min(18, Math.max(settings?.fontSize || 16, 12) + 1),
        },
      });
    }
  }, [navigation, song.title, song.song_number, settings.fontSize]);

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#3182ce' : '#63b3ed',
  };

  const handleFavouriteToggle = async () => {
    try {
      if (isCurrentlyFavourite) {
        await removeFavourite(song.id);
      } else {
        await addFavourite(song.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favourite');
    }
  };


  // Handle add to folder functionality
  const handleAddToFolder = async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot add to folders while offline.');
      return;
    }

    try {
      // Fetch user's folders
      const foldersResult = await fetchFolders();
      if (!foldersResult.data || foldersResult.data.length === 0) {
        Alert.alert(
          'No Folders Found',
          'You don\'t have any folders yet. Create a folder first from the Folders tab.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Go to Folders',
              onPress: () => navigation.navigate('Folders')
            }
          ]
        );
        return;
      }

      // Show folder selection
      const folderOptions = foldersResult.data.slice(0, 5).map(folder => ({
        text: folder.name,
        onPress: () => handleAddSongToFolder(folder.id!),
      }));

      folderOptions.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(
        'Add to Folder',
        `Choose a folder for "${song.title}":`,
        folderOptions
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load folders');
    }
  };

  const handleAddSongToFolder = async (folderId: number) => {
    try {
      const result = await addSongToFolder(song.id, folderId);
      if (result.data) {
        Alert.alert('Success', `"${song.title}" added to folder!`);
      } else {
        Alert.alert('Info', 'Song is already in this folder.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add song to folder');
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Web Desktop Toolbar */}
      <WebToolbar
        isFavourite={isCurrentlyFavourite}
        onFavoriteToggle={handleFavouriteToggle}
        onAddToFolder={handleAddToFolder}
        onBackPress={() => navigation.goBack()}
        songTitle={song.title}
      />


      {/* Lyrics */}
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.webScrollContainer,
            {
              marginTop: 60,
              height: 'calc(100vh - 60px)',
            }
          ]}
        >
          <View style={styles.webLyricsContent}>
            <Text 
              style={[
                styles.webLyrics,
                { 
                  color: colors.text,
                  fontSize: currentFontSize,
                  lineHeight: currentFontSize * 1.6,
                }
              ]}
            >
              {song.lyrics}
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.lyricsContainer} 
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          <Text 
            style={[
              styles.lyrics, 
              { 
                color: colors.text,
                fontSize: currentFontSize,
                lineHeight: currentFontSize * 1.6,
              }
            ]}
          >
            {song.lyrics}
          </Text>
        </ScrollView>
      )}


      {/* Floating Buttons - Hide on Web (replaced by toolbar) */}
      {Platform.OS !== 'web' && (
        <>
          <HeartButton
            isFavourite={isCurrentlyFavourite}
            onToggle={handleFavouriteToggle}
          />
          
          {/* Folder Button - positioned between heart and projection buttons */}
          <View style={[styles.folderButtonContainer, { left: 20 }]}>
            <FolderButton onPress={handleAddToFolder} />
          </View>
          
        </>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricsContent: {
    padding: 20,
    paddingTop: 8, // Reduced top padding since header is removed
    paddingBottom: 100, // Space for floating buttons
  },
  // Web-specific styles
  webScrollContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        overflow: 'auto', // Enable web scrolling
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on webkit
      },
    }),
  },
  webLyricsContent: {
    paddingTop: 40, // More padding on web
    paddingBottom: 200, // Much more bottom padding for full lyrics display
    paddingHorizontal: 40, // More horizontal padding for better readability
    maxWidth: 800, // Limit text width for better readability
    alignSelf: 'center', // Center the content
    minHeight: '150vh', // Ensure content is taller than viewport to enable scrolling
  },
  webLyrics: {
    textAlign: 'center',
    ...Platform.select({
      web: {
        whiteSpace: 'pre-line', // Preserve line breaks on web
      },
    }),
  },
  lyrics: {
    textAlign: 'center',
  },
  folderButtonContainer: {
    position: 'absolute',
    bottom: 90, // Position above heart button
    zIndex: 1000,
  },
});

export default LyricsScreen;
