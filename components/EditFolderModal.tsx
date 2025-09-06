import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';
import { useSupabase } from '../hooks/useSupabase';
import { Folder } from '../constants/Config';

interface EditFolderModalProps {
  visible: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditFolderModal: React.FC<EditFolderModalProps> = ({
  visible,
  folder,
  onClose,
  onSuccess,
}) => {
  const { settings } = useOffline();
  const { updateFolder, loading } = useSupabase();
  const [folderName, setFolderName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Theme colors
  const colors = {
    background: settings.theme === 'light' ? '#ffffff' : '#1a202c',
    overlay: settings.theme === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)',
    cardBackground: settings.theme === 'light' ? '#ffffff' : '#2d3748',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    textSecondary: settings.theme === 'light' ? '#718096' : '#a0aec0',
    accent: settings.theme === 'light' ? '#805ad5' : '#b794f6',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
    error: '#e53e3e',
    success: '#38a169',
  };

  // Initialize folder name when modal opens or folder changes
  useEffect(() => {
    if (visible && folder) {
      setFolderName(folder.name || '');
      setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.selectAll();
      }, 100);
    }
  }, [visible, folder]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setFolderName('');
      setIsUpdating(false);
    }
  }, [visible]);

  const handleUpdateFolder = async () => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter a folder name.');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Folder name must be at least 2 characters long.');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Invalid Name', 'Folder name must be less than 50 characters.');
      return;
    }

    if (!folder?.id) {
      Alert.alert('Error', 'Folder information is missing.');
      return;
    }

    // Check if name actually changed
    if (trimmedName === folder.name) {
      Alert.alert('No Changes', 'Folder name is already "' + trimmedName + '".');
      return;
    }

    setIsUpdating(true);
    Keyboard.dismiss();

    try {
      const result = await updateFolder(folder.id, trimmedName);
      
      if (result.error) {
        Alert.alert('Error', result.error.message || 'Failed to update folder. Please try again.');
        return;
      }

      // Success!
      Alert.alert(
        'Success! ✅',
        `Folder renamed to "${trimmedName}" successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Update folder error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (isUpdating) return; // Don't allow cancel while updating
    onClose();
  };

  const canUpdate = folderName.trim().length >= 2 && !isUpdating && folderName.trim() !== folder?.name;

  if (!folder) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={[styles.overlayTouchable, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="create-outline" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.title, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 18) + 2 }]}>
                Rename Folder
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                Choose a new name for "{folder.name}"
              </Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: Math.max(settings?.fontSize || 16, 14) }]}>
                New Folder Name
              </Text>
              <View style={[
                styles.inputContainer,
                { 
                  borderColor: folderName.trim().length >= 2 ? colors.success : colors.border,
                  backgroundColor: colors.background + '50',
                }
              ]}>
                <Ionicons name="folder-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  ref={textInputRef}
                  style={[styles.textInput, { 
                    color: colors.text, 
                    fontSize: Math.max(settings?.fontSize || 16, 16),
                  }]}
                  placeholder="Enter new folder name"
                  placeholderTextColor={colors.textSecondary}
                  value={folderName}
                  onChangeText={setFolderName}
                  maxLength={50}
                  autoCapitalize="words"
                  autoCorrect={true}
                  returnKeyType="done"
                  onSubmitEditing={canUpdate ? handleUpdateFolder : undefined}
                  editable={!isUpdating}
                />
                {folderName.length > 0 && !isUpdating && (
                  <TouchableOpacity
                    onPress={() => setFolderName('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Character Count */}
              <View style={styles.characterCount}>
                <Text style={[
                  styles.characterCountText,
                  { 
                    color: folderName.length > 45 ? colors.error : colors.textSecondary,
                    fontSize: Math.max(settings?.fontSize || 16, 12),
                  }
                ]}>
                  {folderName.length}/50 characters
                </Text>
              </View>

              {/* Validation Messages */}
              {folderName.trim().length > 0 && folderName.trim().length < 2 && (
                <Text style={[styles.validationText, { color: colors.error, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                  Name must be at least 2 characters
                </Text>
              )}
              {folderName.trim() === folder.name && folderName.trim().length >= 2 && (
                <Text style={[styles.validationText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 12) }]}>
                  This is the current folder name
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: 'transparent',
                  },
                ]}
                onPress={handleCancel}
                disabled={isUpdating}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary, fontSize: Math.max(settings?.fontSize || 16, 16) }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.updateButton,
                  {
                    backgroundColor: canUpdate ? colors.accent : colors.border,
                    opacity: canUpdate ? 1 : 0.6,
                  },
                ]}
                onPress={handleUpdateFolder}
                disabled={!canUpdate}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={[styles.buttonText, { color: 'white', marginLeft: 6, fontSize: Math.max(settings?.fontSize || 16, 16) }]}>
                      Rename Folder
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  characterCountText: {
    fontWeight: '500',
  },
  validationText: {
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  updateButton: {
    shadowColor: '#805ad5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default EditFolderModal;
