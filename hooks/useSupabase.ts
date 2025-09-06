import { useState, useCallback } from 'react';
import { supabaseClient, Song, Favourite, Folder, SongFolder, ApiResponse } from '../constants/Config';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';

interface UseSupabaseReturn {
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Song operations
  fetchSongs: () => Promise<ApiResponse<Song[]>>;
  getSong: (id: number) => Promise<ApiResponse<Song>>;
  searchSongs: (query: string) => Promise<ApiResponse<Song[]>>;
  
  // Favourite operations
  fetchFavourites: () => Promise<ApiResponse<Favourite[]>>;
  addFavourite: (songId: number) => Promise<ApiResponse<Favourite>>;
  removeFavourite: (songId: number) => Promise<ApiResponse<boolean>>;
  isFavourite: (songId: number) => boolean;
  
  // Folder operations
  fetchFolders: () => Promise<ApiResponse<Folder[]>>;
  createFolder: (name: string) => Promise<ApiResponse<Folder>>;
  updateFolder: (id: number, name: string) => Promise<ApiResponse<Folder>>;
  deleteFolder: (id: number) => Promise<ApiResponse<boolean>>;
  
  // Song-Folder operations
  addSongToFolder: (songId: number, folderId: number) => Promise<ApiResponse<SongFolder>>;
  removeSongFromFolder: (songId: number, folderId: number) => Promise<ApiResponse<boolean>>;
  getFolderSongs: (folderId: number) => Promise<ApiResponse<Song[]>>;
  getFolderSongCount: (folderId: number) => Promise<number>;
  
  // Sync operations
  syncAllData: () => Promise<ApiResponse<boolean>>;
}

export const useSupabase = (): UseSupabaseReturn => {
  const { user } = useAuth();
  const { updateCache, isOffline, cachedFavourites } = useOffline();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle offline/online operations
  const executeWithFallback = async <T>(
    onlineOperation: () => Promise<ApiResponse<T>>,
    offlineData?: T
  ): Promise<ApiResponse<T>> => {
    if (isOffline && offlineData !== undefined) {
      return { data: offlineData, error: null };
    }
    
    try {
      return await onlineOperation();
    } catch (err) {
      console.log('Operation failed, might be offline:', err);
      if (offlineData !== undefined) {
        return { data: offlineData, error: null };
      }
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  // ===== SONG OPERATIONS =====
  const fetchSongs = useCallback(async (): Promise<ApiResponse<Song[]>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('songs')
        .select('*')
        .order('song_number', { ascending: true });

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      // Update cache
      if (data) {
        await updateCache({ songs: data });
      }

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch songs';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [updateCache]);

  const getSong = useCallback(async (id: number): Promise<ApiResponse<Song>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch song';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSongs = useCallback(async (query: string): Promise<ApiResponse<Song[]>> => {
    if (!query.trim()) {
      return fetchSongs();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,song_number.eq.${query}`);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search songs';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchSongs]);

  // ===== FAVOURITE OPERATIONS =====
  const fetchFavourites = useCallback(async (): Promise<ApiResponse<Favourite[]>> => {
    if (!user) {
      return { data: [], error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('favourites')
        .select(`
          *,
          song:songs(*)
        `)
        .eq('user_id', user.id);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      // Update cache
      if (data) {
        await updateCache({ favourites: data });
      }

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favourites';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, updateCache]);

  const addFavourite = useCallback(async (songId: number): Promise<ApiResponse<Favourite>> => {
    if (!user) {
      return { data: null, error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if already favourite to prevent duplicates
      const existingFav = cachedFavourites.find(fav => fav.song_id === songId && fav.user_id === user.id);
      if (existingFav) {
        console.log('Song already in favourites:', songId);
        return { data: existingFav, error: null };
      }

      const { data, error: supabaseError } = await supabaseClient
        .from('favourites')
        .insert({
          user_id: user.id,
          song_id: songId,
        })
        .select()
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      console.log('❤️ Added to favourites:', songId, 'Data:', data);

      // Immediately update cache with new favourite
      const updatedFavourites = [...cachedFavourites, data];
      await updateCache({ favourites: updatedFavourites });

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favourite';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, cachedFavourites, updateCache]);

  const removeFavourite = useCallback(async (songId: number): Promise<ApiResponse<boolean>> => {
    if (!user) {
      return { data: false, error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: supabaseError } = await supabaseClient
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: false, error: supabaseError.message };
      }

      console.log('💔 Removed from favourites:', songId);

      // Immediately update cache by removing the favourite
      const updatedFavourites = cachedFavourites.filter(
        fav => !(fav.song_id === songId && fav.user_id === user.id)
      );
      await updateCache({ favourites: updatedFavourites });

      return { data: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favourite';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, cachedFavourites, updateCache]);

  const isFavourite = useCallback((songId: number): boolean => {
    if (!user) return false;
    return cachedFavourites.some(fav => fav.song_id === songId && fav.user_id === user.id);
  }, [user, cachedFavourites]);

  // ===== FOLDER OPERATIONS =====
  const fetchFolders = useCallback(async (): Promise<ApiResponse<Folder[]>> => {
    if (!user) {
      return { data: [], error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      // Update cache
      if (data) {
        await updateCache({ folders: data });
      }

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch folders';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, updateCache]);

  const createFolder = useCallback(async (name: string): Promise<ApiResponse<Folder>> => {
    if (!user) {
      return { data: null, error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('folders')
        .insert({
          user_id: user.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      // Refresh folders cache
      await fetchFolders();

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, fetchFolders]);

  const updateFolder = useCallback(async (id: number, name: string): Promise<ApiResponse<Folder>> => {
    if (!user) {
      return { data: null, error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('folders')
        .update({ name: name.trim() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      // Refresh folders cache
      await fetchFolders();

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, fetchFolders]);

  const deleteFolder = useCallback(async (id: number): Promise<ApiResponse<boolean>> => {
    if (!user) {
      return { data: false, error: 'No user found' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: supabaseError } = await supabaseClient
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: false, error: supabaseError.message };
      }

      // Refresh folders cache
      await fetchFolders();

      return { data: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, fetchFolders]);

  // ===== SONG-FOLDER OPERATIONS =====
  const addSongToFolder = useCallback(async (songId: number, folderId: number): Promise<ApiResponse<SongFolder>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('song_folders')
        .insert({
          song_id: songId,
          folder_id: folderId,
        })
        .select()
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add song to folder';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeSongFromFolder = useCallback(async (songId: number, folderId: number): Promise<ApiResponse<boolean>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: supabaseError } = await supabaseClient
        .from('song_folders')
        .delete()
        .eq('song_id', songId)
        .eq('folder_id', folderId);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: false, error: supabaseError.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove song from folder';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getFolderSongs = useCallback(async (folderId: number): Promise<ApiResponse<Song[]>> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('song_folders')
        .select(`
          song:songs(*)
        `)
        .eq('folder_id', folderId);

      if (supabaseError) {
        setError(supabaseError.message);
        return { data: null, error: supabaseError.message };
      }

      const songs = data?.map(item => item.song).filter(Boolean) || [];
      return { data: songs, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch folder songs';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getFolderSongCount = useCallback(async (folderId: number): Promise<number> => {
    try {
      const { count, error: supabaseError } = await supabaseClient
        .from('song_folders')
        .select('*', { count: 'exact', head: true })
        .eq('folder_id', folderId);

      if (supabaseError) {
        console.error('Error getting folder song count:', supabaseError.message);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting folder song count:', err);
      return 0;
    }
  }, []);

  // ===== SYNC OPERATIONS =====
  const syncAllData = useCallback(async (): Promise<ApiResponse<boolean>> => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data concurrently
      const [songsResult, favouritesResult, foldersResult] = await Promise.all([
        fetchSongs(),
        fetchFavourites(),
        fetchFolders(),
      ]);

      if (songsResult.error || favouritesResult.error || foldersResult.error) {
        const errors = [songsResult.error, favouritesResult.error, foldersResult.error]
          .filter(Boolean)
          .join(', ');
        setError(errors);
        return { data: false, error: errors };
      }

      return { data: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchSongs, fetchFavourites, fetchFolders]);

  return {
    loading,
    error,
    fetchSongs,
    getSong,
    searchSongs,
    fetchFavourites,
    addFavourite,
    removeFavourite,
    isFavourite,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    addSongToFolder,
    removeSongFromFolder,
    getFolderSongs,
    getFolderSongCount,
    syncAllData,
  };
};
