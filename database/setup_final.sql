-- Songbook Database Schema with Supabase Auth Integration
-- This script handles ALL existing tables, constraints, and policies safely

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Songs are viewable by everyone" ON public.songs;
    DROP POLICY IF EXISTS "Songs are insertable by authenticated users" ON public.songs;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view own favourites" ON public.favourites;
    DROP POLICY IF EXISTS "Users can insert own favourites" ON public.favourites;
    DROP POLICY IF EXISTS "Users can delete own favourites" ON public.favourites;
    DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can insert own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can view songs in own folders" ON public.song_folders;
    DROP POLICY IF EXISTS "Users can add songs to own folders" ON public.song_folders;
    DROP POLICY IF EXISTS "Users can remove songs from own folders" ON public.song_folders;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policies don't exist
END $$;

-- Create songs table (if not exists)
CREATE TABLE IF NOT EXISTS public.songs (
  id SERIAL PRIMARY KEY,
  song_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add unique constraint ONLY if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'songs_song_number_unique' 
        AND table_name = 'songs'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.songs ADD CONSTRAINT songs_song_number_unique UNIQUE (song_number);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraint already exists
END $$;

-- Ensure users table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Update users table to reference auth.users ONLY if constraint doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_id_fkey' 
        AND table_name = 'users'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if auth.users doesn't exist yet
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraint already exists
END $$;

-- Create favourites table (if not exists)
CREATE TABLE IF NOT EXISTS public.favourites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add constraints to favourites ONLY if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'favourites_user_id_fkey' 
        AND table_name = 'favourites'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.favourites ADD CONSTRAINT favourites_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for song_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'favourites_song_id_fkey' 
        AND table_name = 'favourites'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.favourites ADD CONSTRAINT favourites_song_id_fkey 
        FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'favourites_user_song_unique' 
        AND table_name = 'favourites'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.favourites ADD CONSTRAINT favourites_user_song_unique 
        UNIQUE (user_id, song_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraints already exist
END $$;

-- Create folders table (if not exists)
CREATE TABLE IF NOT EXISTS public.folders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add constraints to folders ONLY if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_user_id_fkey' 
        AND table_name = 'folders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.folders ADD CONSTRAINT folders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_user_name_unique' 
        AND table_name = 'folders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.folders ADD CONSTRAINT folders_user_name_unique 
        UNIQUE (user_id, name);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraints already exist
END $$;

-- Create song_folders junction table (if not exists)
CREATE TABLE IF NOT EXISTS public.song_folders (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add constraints to song_folders ONLY if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'song_folders_folder_id_fkey' 
        AND table_name = 'song_folders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.song_folders ADD CONSTRAINT song_folders_folder_id_fkey 
        FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'song_folders_song_id_fkey' 
        AND table_name = 'song_folders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.song_folders ADD CONSTRAINT song_folders_song_id_fkey 
        FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'song_folders_folder_song_unique' 
        AND table_name = 'song_folders'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.song_folders ADD CONSTRAINT song_folders_folder_song_unique 
        UNIQUE (folder_id, song_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ignore if constraints already exist
END $$;

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_songs_song_number ON public.songs(song_number);
CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs(title);
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_song_id ON public.favourites(song_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_folder_id ON public.song_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_song_folders_song_id ON public.song_folders(song_id);

-- Insert sample songs (only if they don't exist)
INSERT INTO public.songs (song_number, title, lyrics)
SELECT 1, 'Amazing Grace', 'Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now am found
Was blind, but now I see'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 1);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 2, 'How Great Thou Art', 'O Lord my God, when I in awesome wonder
Consider all the works thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 2);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 3, 'Be Still My Soul', 'Be still, my soul: the Lord is on thy side
Bear patiently the cross of grief or pain
Leave to thy God to order and provide
In every change, he faithful will remain'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 3);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 4, 'It Is Well With My Soul', 'When peace, like a river, attendeth my way
When sorrows like sea billows roll
Whatever my lot, thou hast taught me to say
It is well, it is well with my soul'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 4);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 5, 'Holy, Holy, Holy', 'Holy, holy, holy! Lord God Almighty!
Early in the morning our song shall rise to thee
Holy, holy, holy! Merciful and mighty!
God in three persons, blessed Trinity!'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 5);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 6, 'Great is Thy Faithfulness', 'Great is thy faithfulness, O God my Father
There is no shadow of turning with thee
Thou changest not, thy compassions they fail not
As thou hast been, thou forever will be'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 6);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 7, 'How Deep the Father''s Love', 'How deep the Father''s love for us
How vast beyond all measure
That he should give his only Son
To make a wretch his treasure'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 7);

INSERT INTO public.songs (song_number, title, lyrics)
SELECT 8, 'In Christ Alone', 'In Christ alone my hope is found
He is my light, my strength, my song
This cornerstone, this solid ground
Firm through the fiercest drought and storm'
WHERE NOT EXISTS (SELECT 1 FROM public.songs WHERE song_number = 8);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_folders ENABLE ROW LEVEL SECURITY;

-- Create new RLS Policies (after dropping existing ones above)

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
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile after signup
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_songs_updated_at ON public.songs;

-- Create trigger for songs table
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.songs IS 'Table storing song lyrics and information';
COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.favourites IS 'Table storing user favorite songs';
COMMENT ON TABLE public.folders IS 'Table storing user-created song folders';
COMMENT ON TABLE public.song_folders IS 'Junction table for songs and folders relationship';

-- Success message
SELECT 'Database schema updated successfully for email/password authentication! 🎵' as status;
