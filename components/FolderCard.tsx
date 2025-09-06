import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../constants/Config';
import { useOffline } from '../contexts/OfflineContext';
import { useSupabase } from '../hooks/useSupabase';
import EditFolderModal from './EditFolderModal';

interface FolderCardProps {
  folder: Folder;
  onPress: (folder: Folder) => void;
  showMenuButton?: boolean;
  songCount?: number;
  onFolderUpdate?: () => void; // Callback to refresh folder list after updates
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onPress,
  showMenuButton = true,
  songCount = 0,
  onFolderUpdate,
}) => {
  const { settings } = useOffline();
  const { deleteFolder, updateFolder } = useSupabase();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Theme colors based on light/dark mode
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    border: settings.theme === 'light' ? '#e2e8f0' : '#2d3748',
    primaryText: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    secondaryText: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#805ad5' : '#b794f6',
    icon: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Folder Options',
      `What would you like to do with "${folder.name}"?`,
      [
        {
          text: 'Rename',
          onPress: handleRename,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRename = () => {
    setIsEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    // Trigger refresh of folder list
    if (onFolderUpdate) {
      onFolderUpdate();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? This won't delete the songs, just remove them from this folder.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (folder.id) {
              try {
                const result = await deleteFolder(folder.id);
                if (result.error) {
                  Alert.alert('Error', result.error.message || 'Failed to delete folder');
                } else {
                  // Success - trigger refresh
                  if (onFolderUpdate) {
                    onFolderUpdate();
                  }
                }
              } catch (error) {
                console.error('Delete folder error:', error);
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onPress(folder)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
            <Ionicons name="folder" size={32} color="white" />
          </View>
          
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.name,
                {
                  color: colors.primaryText,
                  fontSize: settings.fontSize,
                },
              ]}
              numberOfLines={1}
            >
              {folder.name}
            </Text>
            
            <Text
              style={[
                styles.songCount,
                {
                  color: colors.secondaryText,
                  fontSize: settings.fontSize - 2,
                },
              ]}
            >
              {songCount} {songCount === 1 ? 'song' : 'songs'}
            </Text>
          </View>

          {showMenuButton && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Edit Folder Modal */}
      <EditFolderModal
        visible={isEditModalVisible}
        folder={folder}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
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
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  songCount: {
    opacity: 0.8,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default FolderCard;
