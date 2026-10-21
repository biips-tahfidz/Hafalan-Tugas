import { supabase } from '../lib/supabase.js';
import { INITIAL_USERS } from '../data/initialUsers.js';

const STORAGE_KEY_USERS = 'hafalan_app_users';
const STORAGE_KEY_CLASSES = 'hafalan_app_teacher_classes';
const STORAGE_KEY_SUBMISSIONS = 'hafalan_app_submissions';

// Helper to load/save localStorage fallback
function getLocal(key, defaultVal) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// Initialize default seed data in localStorage
export function initSeedData() {
  let users = getLocal(STORAGE_KEY_USERS, null);
  if (!users || users.length === 0) {
    users = INITIAL_USERS.map((u, idx) => ({
      id: `user-${idx + 1}`,
      username: u.username,
      password: u.password,
      role: u.role,
      kelas: u.kelas,
      created_at: new Date().toISOString()
    }));
    setLocal(STORAGE_KEY_USERS, users);

    // Initial teacher class assignments
    const teacherClasses = [
      { id: 'tc-1', teacher_id: users.find(u => u.username === 'ratih')?.id, teacher_username: 'ratih', kelas: '1', academic_year: '2024/2025' },
      { id: 'tc-2', teacher_id: users.find(u => u.username === 'hijri')?.id, teacher_username: 'hijri', kelas: '2', academic_year: '2024/2025' },
      { id: 'tc-3', teacher_id: users.find(u => u.username === 'hanifah')?.id, teacher_username: 'hanifah', kelas: '3', academic_year: '2024/2025' },
    ];
    setLocal(STORAGE_KEY_CLASSES, teacherClasses);
  }
  if (!getLocal(STORAGE_KEY_SUBMISSIONS, null)) {
    setLocal(STORAGE_KEY_SUBMISSIONS, []);
  }
}

// Ensure seed data is initialized when module loads
initSeedData();

// --- USER OPERATIONS ---
export async function dbLogin(username, password) {
  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (!error && data) {
      return { success: true, user: data };
    }
  } catch (e) {
    console.log('Supabase query failed, falling back to local DB', e);
  }

  // Fallback to local users
  const users = getLocal(STORAGE_KEY_USERS, []);
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password.trim());
  if (found) {
    return { success: true, user: found };
  }
  return { success: false, message: 'Username atau password salah!' };
}

export async function dbGetUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (!error && data && data.length > 0) return data;
  } catch (e) {}

  return getLocal(STORAGE_KEY_USERS, []);
}

export async function dbAddUser(newUser) {
  const userObj = {
    id: `user-${Date.now()}`,
    username: newUser.username.trim(),
    password: newUser.password.trim(),
    role: newUser.role,
    kelas: newUser.kelas || '1',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('users').insert([userObj]).select().single();
    if (!error && data) {
      // update local
      const users = getLocal(STORAGE_KEY_USERS, []);
      users.push(data);
      setLocal(STORAGE_KEY_USERS, users);
      return { success: true, user: data };
    }
  } catch (e) {}

  const users = getLocal(STORAGE_KEY_USERS, []);
  if (users.some(u => u.username.toLowerCase() === userObj.username.toLowerCase())) {
    return { success: false, message: 'Username sudah digunakan!' };
  }
  users.push(userObj);
  setLocal(STORAGE_KEY_USERS, users);
  return { success: true, user: userObj };
}

export async function dbDeleteUser(userId) {
  try {
    await supabase.from('users').delete().eq('id', userId);
  } catch (e) {}

  let users = getLocal(STORAGE_KEY_USERS, []);
  users = users.filter(u => u.id !== userId);
  setLocal(STORAGE_KEY_USERS, users);

  // Also remove from teacher classes
  let tc = getLocal(STORAGE_KEY_CLASSES, []);
  tc = tc.filter(t => t.teacher_id !== userId);
  setLocal(STORAGE_KEY_CLASSES, tc);

  return { success: true };
}

export async function dbUpdateUserClass(userId, newClass) {
  try {
    await supabase.from('users').update({ kelas: newClass }).eq('id', userId);
  } catch (e) {}

  const users = getLocal(STORAGE_KEY_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].kelas = newClass;
    setLocal(STORAGE_KEY_USERS, users);
  }
  return { success: true };
}

// --- TEACHER CLASS ASSIGNMENTS ---
export async function dbGetTeacherClasses(teacherId = null) {
  try {
    let query = supabase.from('teacher_classes').select('*');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (!error && data) return data;
  } catch (e) {}

  const tc = getLocal(STORAGE_KEY_CLASSES, []);
  if (teacherId) return tc.filter(t => t.teacher_id === teacherId);
  return tc;
}

export async function dbAssignTeacherClass(teacherId, teacherUsername, kelas, academicYear = '2024/2025') {
  const obj = {
    id: `tc-${Date.now()}`,
    teacher_id: teacherId,
    teacher_username: teacherUsername,
    kelas,
    academic_year: academicYear,
    created_at: new Date().toISOString()
  };

  try {
    await supabase.from('teacher_classes').insert([obj]);
  } catch (e) {}

  const tc = getLocal(STORAGE_KEY_CLASSES, []);
  if (!tc.some(t => t.teacher_id === teacherId && t.kelas === kelas)) {
    tc.push(obj);
    setLocal(STORAGE_KEY_CLASSES, tc);
  }
  return { success: true };
}

export async function dbRemoveTeacherClass(teacherId, kelas) {
  try {
    await supabase.from('teacher_classes').delete().eq('teacher_id', teacherId).eq('kelas', kelas);
  } catch (e) {}

  let tc = getLocal(STORAGE_KEY_CLASSES, []);
  tc = tc.filter(t => !(t.teacher_id === teacherId && t.kelas === kelas));
  setLocal(STORAGE_KEY_CLASSES, tc);
  return { success: true };
}

// --- SUBMISSION OPERATIONS ---
export async function dbGetSubmissions() {
  try {
    const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  } catch (e) {}

  return getLocal(STORAGE_KEY_SUBMISSIONS, []);
}

export async function dbUploadFileToStorage(file) {
  // Try uploading to Supabase Storage Bucket 'assignments'
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage.from('assignments').upload(filePath, file);
    if (!error && data) {
      const { data: pubUrlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
      if (pubUrlData?.publicUrl) {
        return pubUrlData.publicUrl;
      }
    }
  } catch (e) {
    console.log('Supabase storage upload error, using local Data URL fallback', e);
  }

  // Fallback to Data URL for local preview/storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

export async function dbAddSubmission(submission) {
  const subObj = {
    id: `sub-${Date.now()}`,
    student_id: submission.student_id,
    student_username: submission.student_username,
    title: submission.title,
    description: submission.description,
    file_url: submission.file_url,
    file_type: submission.file_type, // 'video' | 'audio' | 'image' | 'document'
    file_name: submission.file_name,
    kelas: submission.kelas,
    grade: null,
    feedback: null,
    graded_by: null,
    graded_by_username: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('submissions').insert([subObj]).select().single();
    if (!error && data) {
      const subs = getLocal(STORAGE_KEY_SUBMISSIONS, []);
      subs.unshift(data);
      setLocal(STORAGE_KEY_SUBMISSIONS, subs);
      return { success: true, submission: data };
    }
  } catch (e) {}

  const subs = getLocal(STORAGE_KEY_SUBMISSIONS, []);
  subs.unshift(subObj);
  setLocal(STORAGE_KEY_SUBMISSIONS, subs);
  return { success: true, submission: subObj };
}

export async function dbUpdateSubmission(subId, updatedData) {
  const updateObj = {
    ...updatedData,
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('submissions').update(updateObj).eq('id', subId);
  } catch (e) {}

  const subs = getLocal(STORAGE_KEY_SUBMISSIONS, []);
  const idx = subs.findIndex(s => s.id === subId);
  if (idx !== -1) {
    subs[idx] = { ...subs[idx], ...updateObj };
    setLocal(STORAGE_KEY_SUBMISSIONS, subs);
  }
  return { success: true };
}

export async function dbGradeSubmission(subId, grade, feedback, teacherId, teacherUsername) {
  const gradeObj = {
    grade,
    feedback,
    graded_by: teacherId,
    graded_by_username: teacherUsername,
    graded_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('submissions').update(gradeObj).eq('id', subId);
  } catch (e) {}

  const subs = getLocal(STORAGE_KEY_SUBMISSIONS, []);
  const idx = subs.findIndex(s => s.id === subId);
  if (idx !== -1) {
    subs[idx] = { ...subs[idx], ...gradeObj };
    setLocal(STORAGE_KEY_SUBMISSIONS, subs);
  }
  return { success: true };
}

export async function dbDeleteSubmission(subId) {
  try {
    await supabase.from('submissions').delete().eq('id', subId);
  } catch (e) {}

  let subs = getLocal(STORAGE_KEY_SUBMISSIONS, []);
  subs = subs.filter(s => s.id !== subId);
  setLocal(STORAGE_KEY_SUBMISSIONS, subs);
  return { success: true };
}
