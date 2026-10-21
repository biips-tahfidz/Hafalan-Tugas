-- Database Schema for Setoran Hafalan & Tugas Application

-- 1. Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('santri', 'guru', 'mudir')),
    kelas VARCHAR(50) DEFAULT '1', -- For santri default class, or 'semua' for mudir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: teacher_classes (mapping which classes a teacher is assigned to)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    kelas VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) DEFAULT '2024/2025',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, kelas, academic_year)
);

-- 3. Table: submissions (Setoran Hafalan & Tugas)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_username VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'document'
    file_name VARCHAR(255),
    kelas VARCHAR(50) NOT NULL,
    grade VARCHAR(20) DEFAULT NULL, -- Nilai (e.g., 'A', '85', 'Sangat Baik', etc.)
    feedback TEXT DEFAULT NULL, -- Catatan Guru/Mudir
    graded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    graded_by_username VARCHAR(100) DEFAULT NULL,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and setup permissive policies for anon / public role (since app authenticates directly via users table)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to teacher_classes" ON public.teacher_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access to submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket setup statement (to be created in Supabase Dashboard or via API/SQL)
-- Storage Bucket Name: "assignments"
-- Public Bucket: true
