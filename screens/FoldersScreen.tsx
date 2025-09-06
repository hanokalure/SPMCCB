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
import { Folder } from '../constants/Config';
import { useSupabase } from '../hooks/useSupabase';
import { useOffline } from '../contexts/OfflineContext';
import FolderCard from '../components/FolderCard';
import FloatingButton from '../components/FloatingButton';
import Button from '../components/Button';
import CreateFolderModal from '../components/CreateFolderModal';

interface FoldersScreenProps {
  navigation: any;
}

const FoldersScreen: React.FC<FoldersScreenProps> = ({ navigation }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderSongCounts, setFolderSongCounts] = useState<{[key: number]: number}>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { fetchFolders, createFolder, getFolderSongCount, loading, error } = useSupabase();
  const { getFolders, settings, isOffline } = useOffline();

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#1a202c',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    subText: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  // Load folders on screen focus
  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, [])
  );

  const loadFolders = async () => {
    try {
      // Try to fetch from Supabase first
      const result = await fetchFolders();
      if (result.data) {
        setFolders(result.data);
        // Load song counts for each folder
        await loadFolderSongCounts(result.data);
      } else {
        // Fall back to cached data
        const cachedFolders = getFolders();
        setFolders(cachedFolders);
        await loadFolderSongCounts(cachedFolders);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      // Use cached data as fallback
      const cachedFolders = getFolders();
      setFolders(cachedFolders);
      await loadFolderSongCounts(cachedFolders);
    }
  };

  const loadFolderSongCounts = async (foldersList: Folder[]) => {
    if (isOffline) {
      // In offline mode, we can't get accurate counts, so set to 0
      const counts: {[key: number]: number} = {};
      foldersList.forEach(folder => {
        if (folder.id) {
          counts[folder.id] = 0;
        }
      });
      setFolderSongCounts(counts);
      return;
    }

    const counts: {[key: number]: number} = {};
    
    // Load song counts for each folder concurrently
    await Promise.all(
      foldersList.map(async (folder) => {
        if (folder.id) {
          try {
            const count = await getFolderSongCount(folder.id);
            counts[folder.id] = count;
          } catch (err) {
            console.error(`Error getting song count for folder ${folder.id}:`, err);
            counts[folder.id] = 0;
          }
        }
      })
    );
    
    setFolderSongCounts(counts);
  };

  const handleRefresh = async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline. Showing cached data.');
      return;
    }
    
    setRefreshing(true);
    try {
      await loadFolders();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh folders');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFolderPress = (folder: Folder) => {
    navigation.navigate('FolderDetail', { folder });
  };

  const handleCreateFolder = () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot create folders while offline.');
      return;
    }

    setShowCreateModal(true);
  };

  const handleCreateSuccess = async () => {
    await loadFolders();
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const renderFolder = ({ item }: { item: Folder }) => {
    const songCount = item.id ? (folderSongCounts[item.id] || 0) : 0;
    
    return (
      <FolderCard
        folder={item}
        onPress={handleFolderPress}
        showMenuButton={true}
        songCount={songCount}
        onFolderUpdate={loadFolders} // Refresh folder list when folder is updated or deleted
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No folders created yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
        Create folders to organize your favourite songs by theme, occasion, or any way you prefer
      </Text>
      {!isOffline && (
        <Button
          title="Create Your First Folder"
          onPress={handleCreateFolder}
          loading={loading}
          icon="folder-outline"
          variant="primary"
          size="medium"
        />
      )}
      {isOffline && (
        <Text style={[styles.offlineText, { color: colors.subText }]}>
          📱 Offline mode - Cannot create folders
        </Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={[styles.offlineBannerText, { color: colors.subText }]}>
            📱 Offline - Showing cached folders
          </Text>
        </View>
      )}
      
      
      <Text style={[styles.instructionText, { color: colors.subText }]}>
        Organize your songs into custom folders. Tap a folder to view its contents, or use the menu to rename or delete folders.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={folders}
        renderItem={renderFolder}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
        contentContainerStyle={folders.length === 0 ? styles.emptyList : undefined}
      />
      
      {/* Floating Action Button for creating folders */}
      {!isOffline && (
        <FloatingButton
          icon="add"
          onPress={handleCreateFolder}
          position="bottom-right"
        />
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Create Folder Modal */}
      <CreateFolderModal
        visible={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  offlineBanner: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statsContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
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

export default FoldersScreen;
