import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Song } from '../constants/Config';
import { useSupabase } from '../hooks/useSupabase';
import { useOffline } from '../contexts/OfflineContext';
import SearchBar from '../components/SearchBar';
import SongCard from '../components/SongCard';
import Button from '../components/Button';

interface FavouritesScreenProps {
  navigation: any;
}

const FavouritesScreen: React.FC<FavouritesScreenProps> = ({ navigation }) => {
  const [favouriteSongs, setFavouriteSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { fetchFavourites, loading, error } = useSupabase();
  const { getFavourites, getSongs, settings, isOffline } = useOffline();

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  // Load favourites on screen focus
  useFocusEffect(
    useCallback(() => {
      loadFavourites();
    }, [])
  );

  // Filter songs when search query changes
  React.useEffect(() => {
    filterSongs();
  }, [searchQuery, favouriteSongs]);

  const loadFavourites = async () => {
    try {
      // Try to fetch from Supabase first
      const result = await fetchFavourites();
      if (result.data) {
        // Extract songs from favourites data
        const songs = result.data
          .map(fav => fav.song)
          .filter((song): song is Song => song !== undefined);
        setFavouriteSongs(songs);
      } else {
        // Fall back to cached data
        loadCachedFavourites();
      }
    } catch (err) {
      console.error('Error loading favourites:', err);
      // Use cached data as fallback
      loadCachedFavourites();
    }
  };

  const loadCachedFavourites = () => {
    const cachedFavourites = getFavourites();
    const allSongs = getSongs();
    
    // Match favourite song IDs with actual song data
    const songs = cachedFavourites
      .map(fav => allSongs.find(song => song.id === fav.song_id))
      .filter((song): song is Song => song !== undefined);
    
    setFavouriteSongs(songs);
  };

  const filterSongs = () => {
    if (!searchQuery.trim()) {
      setFilteredSongs(favouriteSongs);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = favouriteSongs.filter(
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
      await loadFavourites();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh favourites');
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
        {searchQuery ? 'No favourites found' : 'No favourite songs yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'Tap the heart button on any song to add it to your favourites'}
      </Text>
      {!searchQuery && (
        <Button
          title="Browse Songs"
          onPress={() => navigation.navigate('Songs')}
          icon="musical-notes"
          variant="primary"
          size="medium"
        />
      )}
      {isOffline && (
        <Text style={[styles.offlineText, { color: colors.subText }]}>
          📱 Offline mode - Showing cached favourites
        </Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        placeholder="Search your favourite songs..."
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
            ? `${filteredSongs.length} favourites found`
            : `${favouriteSongs.length} favourite ${favouriteSongs.length === 1 ? 'song' : 'songs'}`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredSongs}
        renderItem={renderSong}
        keyExtractor={(item) => `fav_${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[settings.theme === 'light' ? '#e53e3e' : '#fc8181']}
            tintColor={settings.theme === 'light' ? '#e53e3e' : '#fc8181'}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredSongs.length === 0 ? styles.emptyList : undefined}
      />
      
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

export default FavouritesScreen;
