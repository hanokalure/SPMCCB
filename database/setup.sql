-- Songbook Database Schema with Supabase Auth Integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id SERIAL PRIMARY KEY,
  song_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create users table that references auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create favourites table
CREATE TABLE IF NOT EXISTS public.favourites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT favourites_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE,
  CONSTRAINT favourites_user_song_unique UNIQUE (user_id, song_id)
);

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT folders_user_name_unique UNIQUE (user_id, name)
);

-- Create song_folders junction table
CREATE TABLE IF NOT EXISTS public.song_folders (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT song_folders_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE,
  CONSTRAINT song_folders_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE,
  CONSTRAINT song_folders_folder_song_unique UNIQUE (folder_id, song_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_song_number ON public.songs(song_number);
CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs(title);
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_song_id ON public.favourites(song_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_folder_id ON public.song_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_song_id ON public.song_folders(song_id);

-- Insert sample songs
INSERT INTO public.songs (song_number, title, lyrics) VALUES 
(1, 'Amazing Grace', 'Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now am found
Was blind, but now I see'),
(2, 'How Great Thou Art', 'O Lord my God, when I in awesome wonder
Consider all the works thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed'),
(3, 'Be Still My Soul', 'Be still, my soul: the Lord is on thy side
Bear patiently the cross of grief or pain
Leave to thy God to order and provide
In every change, he faithful will remain'),
(4, 'It Is Well With My Soul', 'When peace, like a river, attendeth my way
When sorrows like sea billows roll
Whatever my lot, thou hast taught me to say
It is well, it is well with my soul'),
(5, 'Holy, Holy, Holy', 'Holy, holy, holy! Lord God Almighty!
Early in the morning our song shall rise to thee
Holy, holy, holy! Merciful and mighty!
God in three persons, blessed Trinity!')
ON CONFLICT (song_number) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for songs (everyone can read)
CREATE POLICY "Songs are viewable by everyone" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Songs are insertable by authenticated users" ON public.songs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for users (users can only see/modify their own profile)
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for favourites (users can only see/modify their own favourites)
CREATE POLICY "Users can view own favourites" ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favourites" ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favourites" ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for folders (users can only see/modify their own folders)
CREATE POLICY "Users can view own folders" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for song_folders (users can only modify folders they own)
CREATE POLICY "Users can view songs in own folders" ON public.song_folders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.folders 
    WHERE folders.id = song_folders.folder_id AND folders.user_id = auth.uid()
  )
);
CREATE POLICY "Users can add songs to own folders" ON public.song_folders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.folders 
    WHERE folders.id = song_folders.folder_id AND folders.user_id = auth.uid()
  )
);
CREATE POLICY "Users can remove songs from own folders" ON public.song_folders FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.folders 
    WHERE folders.id = song_folders.folder_id AND folders.user_id = auth.uid()
  )
);

-- Function to automatically create user profile after auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for songs table
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.songs IS 'Table storing song lyrics and information';
COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.favourites IS 'Table storing user favorite songs';
COMMENT ON TABLE public.folders IS 'Table storing user-created song folders';
COMMENT ON TABLE public.song_folders IS 'Junction table for songs and folders relationship';

-- Songbook App Database Setup
-- This file contains the SQL commands to set up your Supabase database
-- Run this in your Supabase SQL Editor

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id SERIAL PRIMARY KEY,
  song_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create favourites table
CREATE TABLE IF NOT EXISTS public.favourites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, song_id)
);

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create song_folders junction table
CREATE TABLE IF NOT EXISTS public.song_folders (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES public.folders(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(folder_id, song_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_song_number ON public.songs(song_number);
CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs(title);
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_song_id ON public.favourites(song_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_folder_id ON public.song_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_song_id ON public.song_folders(song_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only access their own user record
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Songs are public (everyone can read)
CREATE POLICY "Songs are viewable by everyone" ON public.songs
  FOR SELECT USING (true);

-- Only authenticated users can manage favourites (their own)
CREATE POLICY "Users can view own favourites" ON public.favourites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favourites" ON public.favourites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favourites" ON public.favourites
  FOR DELETE USING (auth.uid() = user_id);

-- Only authenticated users can manage folders (their own)
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- Song folders inherit folder permissions
CREATE POLICY "Users can view own song_folders" ON public.song_folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = song_folders.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own folders" ON public.song_folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = song_folders.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from own folders" ON public.song_folders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = song_folders.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Allow anonymous access to songs table only
GRANT SELECT ON public.songs TO anon;
