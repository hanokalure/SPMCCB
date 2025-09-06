import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
// UUID functionality is handled in AuthContext

// Supabase configuration
// These values are loaded from environment variables
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client with AsyncStorage for React Native
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// App configuration
export const APP_CONFIG = {
  name: 'SingHisWord',
  version: '1.0.0',
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// TypeScript interfaces
export interface Song {
  id: number;
  song_number: number;
  title: string;
  lyrics: string;
  created_at?: string;
  updated_at?: string;
}

export interface Favourite {
  id?: number;
  user_id: string;
  song_id: number;
  created_at?: string;
  song?: Song; // Optional populated song data
}

export interface Folder {
  id?: number;
  user_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SongFolder {
  id?: number;
  song_id: number;
  folder_id: number;
  created_at?: string;
  song?: Song; // Optional populated song data
}

// User interface (auth-based user)
export interface User {
  id: string; // UUID from auth.users
  email: string;
  username?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Device and theme types
export interface DeviceInfo {
  id: string;
  platform: string;
  created_at: string;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  autoSync: boolean;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Lyrics: { song: Song };
  FolderDetail: { folder: Folder };
  Settings: undefined;
  Login: undefined;
  Signup: undefined;
};

export type BottomTabParamList = {
  Songs: undefined;
  Favourites: undefined;
  Folders: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Cache types
export interface CacheData {
  songs: Song[];
  favourites: Favourite[];
  folders: Folder[];
  lastUpdated: number;
}

// Search and filter types
export interface SearchFilters {
  query: string;
  sortBy: 'number' | 'title' | 'recent';
  sortOrder: 'asc' | 'desc';
}
