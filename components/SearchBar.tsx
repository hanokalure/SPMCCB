import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search songs...',
  onSearch,
  value = '',
  autoFocus = false,
}) => {
  const { settings } = useOffline();
  const [internalQuery, setInternalQuery] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Theme colors based on light/dark mode
  const colors = {
    background: settings.theme === 'light' ? '#f8f9fa' : '#2d3748',
    border: settings.theme === 'light' ? '#e2e8f0' : '#4a5568',
    text: settings.theme === 'light' ? '#2d3748' : '#f7fafc',
    placeholder: settings.theme === 'light' ? '#a0aec0' : '#718096',
    icon: settings.theme === 'light' ? '#718096' : '#a0aec0',
  };

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
  }, [onSearch]);

  const handleTextChange = (text: string) => {
    setInternalQuery(text);
    debouncedSearch(text);
  };

  // Sync internal query with external value
  React.useEffect(() => {
    if (value !== internalQuery) {
      setInternalQuery(value);
    }
  }, [value]);

  const handleClear = () => {
    setInternalQuery('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSearch('');
  };

  const handleSubmit = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSearch(internalQuery);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Ionicons 
        name="search" 
        size={20} 
        color={colors.icon} 
        style={styles.searchIcon} 
      />
      
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            color: colors.text,
            fontSize: settings.fontSize - 2,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={internalQuery}
        onChangeText={handleTextChange}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false}
        clearButtonMode="never"
        enablesReturnKeyAutomatically={false}
      />
      
      {internalQuery.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginHorizontal: Platform.OS === 'web' ? 16 : 8,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default SearchBar;
