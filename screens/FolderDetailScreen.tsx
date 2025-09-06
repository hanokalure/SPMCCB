import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Song, Folder } from '../constants/Config';
import { useSupabase } from '../hooks/useSupabase';
import { useOffline } from '../contexts/OfflineContext';
import SearchBar from '../components/SearchBar';
import SongCard from '../components/SongCard';
import FloatingButton from '../components/FloatingButton';
import Button from '../components/Button';

interface FolderDetailScreenProps {
  route: {
    params: {
      folder: Folder;
    };
  };
  navigation: any;
}

const FolderDetailScreen: React.FC<FolderDetailScreenProps> = ({ route, navigation }) => {
  const { folder } = route.params;
  const [folderSongs, setFolderSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  
  const { 
    getFolderSongs, 
    fetchSongs, 
    addSongToFolder, 
    removeSongFromFolder,
    loading, 
    error 
  } = useSupabase();
  const { getSongs, settings, isOffline } = useOffline();

  // Set navigation title
  React.useEffect(() => {
    navigation.setOptions({
      title: folder.name,
    });
  }, [navigation, folder.name]);

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  // Load folder songs on screen focus
  useFocusEffect(
    useCallback(() => {
      loadFolderSongs();
      loadAllSongs();
    }, [])
  );

  // Filter songs when search query changes
  React.useEffect(() => {
    filterSongs();
  }, [searchQuery, folderSongs]);

  const loadFolderSongs = async () => {
    if (!folder.id) return;
    
    try {
      const result = await getFolderSongs(folder.id);
      if (result.data) {
        setFolderSongs(result.data);
      }
    } catch (err) {
      console.error('Error loading folder songs:', err);
    }
  };

  const loadAllSongs = async () => {
    try {
      const result = await fetchSongs();
      if (result.data) {
        setAllSongs(result.data);
      } else {
        setAllSongs(getSongs());
      }
    } catch (err) {
      setAllSongs(getSongs());
    }
  };

  const filterSongs = () => {
    if (!searchQuery.trim()) {
      setFilteredSongs(folderSongs);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = folderSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.song_number.toString().includes(query) ||
        song.lyrics.toLowerCase().includes(query)
    );
    
    setFilteredSongs(filtered);
  };

  const handleRefresh = async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline. Showing cached data.');
      return;
    }
    
    setRefreshing(true);
    try {
      await loadFolderSongs();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh folder contents');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSongPress = (song: Song) => {
    navigation.navigate('Lyrics', { song });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddSongs = () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot add songs while offline.');
      return;
    }

    // Get songs not already in this folder
    const availableSongs = allSongs.filter(song => 
      !folderSongs.some(folderSong => folderSong.id === song.id)
    );

    if (availableSongs.length === 0) {
      Alert.alert('No Songs Available', 'All songs are already in this folder.');
      return;
    }

    // Show selection list
    const options = availableSongs.slice(0, 5).map((song, index) => ({
      text: `${song.song_number}. ${song.title}`,
      onPress: () => handleAddSongToFolder(song),
    }));

    options.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' });

    Alert.alert(
      'Add Song to Folder',
      `Choose a song to add to "${folder.name}":`,
      options
    );
  };

  const handleAddSongToFolder = async (song: Song) => {
    if (!folder.id) return;
    
    try {
      const result = await addSongToFolder(song.id, folder.id);
      if (result.data) {
        await loadFolderSongs();
        Alert.alert('Success', `"${song.title}" added to folder!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add song to folder');
    }
  };

  const handleRemoveSongFromFolder = async (song: Song) => {
    if (!folder.id) return;

    Alert.alert(
      'Remove Song',
      `Remove "${song.title}" from this folder?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeSongFromFolder(song.id, folder.id!);
              if (result.data) {
                await loadFolderSongs();
                Alert.alert('Success', 'Song removed from folder!');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove song from folder');
            }
          },
        },
      ]
    );
  };

  const renderSong = ({ item }: { item: Song }) => (
    <SongCard
      song={item}
      onPress={handleSongPress}
      showFavouriteButton={true}
      showNumber={true}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No songs found' : 'No songs in this folder'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : `Add songs to "${folder.name}" to organize your music`}
      </Text>
      {!searchQuery && !isOffline && (
        <Button
          title="Add Songs"
          onPress={handleAddSongs}
          loading={loading}
          icon="add-circle-outline"
          variant="primary"
          size="medium"
        />
      )}
      {isOffline && (
        <Text style={[styles.offlineText, { color: colors.subText }]}>
          📱 Offline mode - Cannot modify folder
        </Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        placeholder={`Search in ${folder.name}...`}
        onSearch={handleSearch}
        debounceMs={300}
      />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={[styles.offlineBannerText, { color: colors.subText }]}>
            📱 Offline - Showing cached data
          </Text>
        </View>
      )}
      
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: colors.subText }]}>
          {searchQuery
            ? `${filteredSongs.length} songs found`
            : `${folderSongs.length} songs in this folder`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredSongs}
        renderItem={renderSong}
        keyExtractor={(item) => `folder_song_${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[settings.theme === 'light' ? '#805ad5' : '#b794f6']}
            tintColor={settings.theme === 'light' ? '#805ad5' : '#b794f6'}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredSongs.length === 0 ? styles.emptyList : undefined}
      />
      
      {/* Floating Action Button for adding songs */}
      {!isOffline && folderSongs.length > 0 && (
        <FloatingButton
          icon="add"
          onPress={handleAddSongs}
          position="bottom-right"
        />
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
  },
  offlineBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  offlineText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fed7d7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#c53030',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default FolderDetailScreen;
