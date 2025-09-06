import React, { useState, useEffect, useMemo, useCallback, useMemo as useMemoized } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { Song } from '../constants/Config';
import { useSupabase } from '../hooks/useSupabase';
import { useOffline } from '../contexts/OfflineContext';
import SearchBar from '../components/SearchBar';
import SongCard from '../components/SongCard';
import Button from '../components/Button';

interface SongsScreenProps {
  navigation: any;
}

const SongsScreen: React.FC<SongsScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  
  const { fetchSongs, syncAllData, loading, error } = useSupabase();
  const { getSongs, settings, isOffline } = useOffline();

  // Initialize songs when component mounts
  useEffect(() => {
    const cachedSongs = getSongs();
    if (cachedSongs.length > 0) {
      setAllSongs(cachedSongs);
    } else {
      loadSongs();
    }
  }, []);

  // Filter songs based on search query using useMemo for performance
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSongs;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Check if query is a number (for song number search)
    const isNumberSearch = /^\d+$/.test(query);
    
    return allSongs.filter((song) => {
      if (isNumberSearch) {
        // For number searches, only search in song_number
        const songNumber = song.song_number.toString();
        return songNumber === query || songNumber.startsWith(query);
      } else {
        // For text searches, only search in title
        return song.title.toLowerCase().includes(query);
      }
    }).sort((a, b) => {
      if (isNumberSearch) {
        // For number searches, sort by song number
        return parseInt(a.song_number.toString()) - parseInt(b.song_number.toString());
      } else {
        // For text searches, sort alphabetically by title
        return a.title.localeCompare(b.title);
      }
    });
  }, [allSongs, searchQuery]);

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  const loadSongs = async () => {
    try {
      const result = await fetchSongs();
      if (result.data) {
        setAllSongs(result.data);
      } else {
        const cachedSongs = getSongs();
        setAllSongs(cachedSongs);
      }
    } catch (err) {
      console.error('Error loading songs:', err);
      const cachedSongs = getSongs();
      setAllSongs(cachedSongs);
    }
  };

  const handleRefresh = async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline. Showing cached data.');
      return;
    }
    
    setRefreshing(true);
    try {
      await syncAllData();
      await loadSongs();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh songs');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSongPress = (song: Song) => {
    console.log('Song pressed:', song.title, 'Navigating to Lyrics screen');
    try {
      navigation.navigate('Lyrics', { song });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not open lyrics screen');
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const renderSong = ({ item }: { item: Song }) => (
    <SongCard
      song={item}
      onPress={handleSongPress}
      showFavouriteButton={true}
      showNumber={true}
    />
  );

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No songs found' : 'No songs available'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'Songs will appear here once loaded from the database'}
      </Text>
      {!searchQuery && !isOffline && (
        <Button
          title="Sync Songs"
          onPress={handleRefresh}
          loading={loading || refreshing}
          icon="refresh"
          variant="primary"
          size="medium"
        />
      )}
      {isOffline && (
        <Text style={[styles.offlineText, { color: colors.subText }]}>
          📱 Offline mode - Showing cached songs
        </Text>
      )}
    </View>
  ), [searchQuery, isOffline, colors.text, colors.subText, handleRefresh, loading, refreshing]);

  const renderHeader = useMemoized(() => (
    <View style={styles.header}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search songs by title, number, or lyrics..."
          onSearch={handleSearch}
          value={searchQuery}
        />
      </View>
      
      {/* Status Banner */}
      {isOffline && (
        <View style={[styles.statusBanner, { backgroundColor: colors.subText + '15' }]}>
          <Text style={[styles.statusText, { color: colors.subText }]}>
            📱 Offline Mode - Showing cached songs
          </Text>
        </View>
      )}
      
    </View>
  ), [searchQuery, isOffline, colors.subText, handleSearch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? (
        <div
          style={{
            flex: 1,
            height: '100vh',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ paddingBottom: '200px', minHeight: '120vh' }}>
            {/* Header for web */}
            <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
              {renderHeader()}
            </div>
            
            {/* Songs list for web */}
            {filteredSongs.length === 0 ? (
              <div>{renderEmpty()}</div>
            ) : (
              filteredSongs.map((song) => (
                <div key={song.id.toString()}>
                  {renderSong({ item: song })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <FlatList
          data={filteredSongs}
          renderItem={renderSong}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[settings.theme === 'light' ? '#3182ce' : '#63b3ed']}
              tintColor={settings.theme === 'light' ? '#3182ce' : '#63b3ed'}
            />
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={filteredSongs.length === 0 ? styles.emptyList : styles.listContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          getItemLayout={undefined}
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchSection: {
    paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
    paddingBottom: 16,
  },
  statusBanner: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  // Web-specific styles for proper scrolling
  webFlatList: {
    ...Platform.select({
      web: {
        overflow: 'auto', // Enable web scrolling
        WebkitOverflowScrolling: 'touch', // Smooth scrolling
        height: '100vh', // Full viewport height
      },
    }),
  },
  webListContainer: {
    paddingBottom: 200, // Extra bottom padding for web to show all content
    minHeight: '120vh', // Ensure content is taller than viewport for scrolling
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

export default SongsScreen;
