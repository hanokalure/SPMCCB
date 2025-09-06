import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, Favourite, Folder, CacheData, APP_CONFIG, AppSettings, ThemeMode } from '../constants/Config';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  // Cache data
  cachedSongs: Song[];
  cachedFavourites: Favourite[];
  cachedFolders: Folder[];
  isOffline: boolean;
  lastSync: Date | null;
  
  // Settings
  settings: AppSettings;
  
  // Cache management
  updateCache: (data: Partial<CacheData>) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<number>;
  
  // Settings management
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
  updateFontSize: (size: number) => Promise<void>;
  
  // Data getters with offline fallback
  getSongs: () => Song[];
  getFavourites: () => Favourite[];
  getFolders: () => Folder[];
  isCacheExpired: () => boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light' as ThemeMode,
  fontSize: 16,
  autoSync: true,
};

// Ensure settings always have valid values
const ensureValidSettings = (settings: AppSettings): AppSettings => ({
  theme: settings?.theme || 'light',
  fontSize: Math.max(settings?.fontSize || 16, 12),
  autoSync: settings?.autoSync ?? true,
});

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [cachedSongs, setCachedSongs] = useState<Song[]>([]);
  const [cachedFavourites, setCachedFavourites] = useState<Favourite[]>([]);
  const [cachedFolders, setCachedFolders] = useState<Folder[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const STORAGE_KEYS = {
    CACHE_DATA: 'songbook_cache_data',
    SETTINGS: 'songbook_settings',
    LAST_SYNC: 'songbook_last_sync',
  };

  // Load cached data from AsyncStorage
  const loadCachedData = async (): Promise<void> => {
    try {
      const [cachedDataString, settingsString, lastSyncString] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CACHE_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      // Load cache data
      if (cachedDataString) {
        const cacheData: CacheData = JSON.parse(cachedDataString);
        setCachedSongs(cacheData.songs || []);
        setCachedFavourites(cacheData.favourites || []);
        setCachedFolders(cacheData.folders || []);
      }

      // Load settings
      if (settingsString) {
        const loadedSettings = JSON.parse(settingsString);
        setSettings(ensureValidSettings({ ...DEFAULT_SETTINGS, ...loadedSettings }));
      } else {
        setSettings(ensureValidSettings(DEFAULT_SETTINGS));
      }

      // Load last sync date
      if (lastSyncString) {
        setLastSync(new Date(lastSyncString));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  // Update cache with new data
  const updateCache = async (data: Partial<CacheData>): Promise<void> => {
    try {
      const currentTime = Date.now();
      
      // Update state
      if (data.songs !== undefined) setCachedSongs(data.songs);
      if (data.favourites !== undefined) setCachedFavourites(data.favourites);
      if (data.folders !== undefined) setCachedFolders(data.folders);

      // Prepare cache data object
      const cacheData: CacheData = {
        songs: data.songs !== undefined ? data.songs : cachedSongs,
        favourites: data.favourites !== undefined ? data.favourites : cachedFavourites,
        folders: data.folders !== undefined ? data.folders : cachedFolders,
        lastUpdated: currentTime,
      };

      // Save to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CACHE_DATA, JSON.stringify(cacheData)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);

      setLastSync(new Date());
    } catch (error) {
      console.error('Error updating cache:', error);
      throw error;
    }
  };

  // Clear all cached data
  const clearCache = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CACHE_DATA,
        STORAGE_KEYS.LAST_SYNC,
      ]);
      
      setCachedSongs([]);
      setCachedFavourites([]);
      setCachedFolders([]);
      setLastSync(null);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  };

  // Get cache size in bytes (approximate)
  const getCacheSize = async (): Promise<number> => {
    try {
      const cachedDataString = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_DATA);
      return cachedDataString ? new Blob([cachedDataString]).size : 0;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  };

  // Update app settings
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Toggle theme between light and dark
  const toggleTheme = async (): Promise<void> => {
    const newTheme: ThemeMode = settings.theme === 'light' ? 'dark' : 'light';
    await updateSettings({ theme: newTheme });
  };

  // Update font size
  const updateFontSize = async (size: number): Promise<void> => {
    await updateSettings({ fontSize: Math.max(12, Math.min(32, size)) });
  };

  // Check if cache is expired
  const isCacheExpired = (): boolean => {
    if (!lastSync) return true;
    const timeDiff = Date.now() - lastSync.getTime();
    return timeDiff > APP_CONFIG.cacheTimeout;
  };

  // Data getters with offline support
  const getSongs = (): Song[] => cachedSongs;
  const getFavourites = (): Favourite[] => {
    if (!user) return [];
    return cachedFavourites.filter(fav => fav.user_id === user.id);
  };
  const getFolders = (): Folder[] => {
    if (!user) return [];
    return cachedFolders.filter(folder => folder.user_id === user.id);
  };

  // Network status monitoring (simplified)
  useEffect(() => {
    // In a real app, you'd use @react-native-community/netinfo
    // For now, we'll assume online unless specific errors occur
    setIsOffline(false);
  }, []);

  // Load cached data on mount and when user changes
  useEffect(() => {
    loadCachedData();
  }, [user]);

  const value: OfflineContextType = {
    cachedSongs,
    cachedFavourites,
    cachedFolders,
    isOffline,
    lastSync,
    settings,
    updateCache,
    clearCache,
    getCacheSize,
    updateSettings,
    toggleTheme,
    updateFontSize,
    getSongs,
    getFavourites,
    getFolders,
    isCacheExpired,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

// Hook to use offline context
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
