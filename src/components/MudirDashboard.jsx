import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, UserPlus, Trash2, Edit2, BookOpen, Award, CheckCircle2, Clock, Filter, Plus, UserCheck } from 'lucide-react';
import { dbGetUsers, dbAddUser, dbDeleteUser, dbGetTeacherClasses, dbAssignTeacherClass, dbRemoveTeacherClass, dbGetSubmissions, dbGradeSubmission } from '../services/db';
import FilePreview from './FilePreview';
import SantriDashboard from './SantriDashboard';

export default function MudirDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'teachers' | 'grading' | 'as_santri'

  const [users, setUsers] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modal User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('santri'); // 'santri' | 'guru' | 'mudir'
  const [newKelas, setNewKelas] = useState('1');
  const [userModalError, setUserModalError] = useState('');

  // Modal Teacher Class Assign
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [assignClass, setAssignClass] = useState('1');

  // Modal Grading State
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const uList = await dbGetUsers();
    setUsers(uList);

    const tcList = await dbGetTeacherClasses();
    setTeacherClasses(tcList);

    const subList = await dbGetSubmissions();
    setSubmissions(subList);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (classFilter !== 'ALL' && u.kelas !== classFilter) return false;
    return true;
  });

  // Filtered Submissions across whole school
  const filteredSubmissions = submissions.filter(sub => {
    if (classFilter !== 'ALL' && sub.kelas !== classFilter) return false;
    return true;
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setUserModalError('Username dan Password wajib diisi!');
      return;
    }

    const res = await dbAddUser({
      username: newUsername,
      password: newPassword,
      role: newRole,
      kelas: newRole === 'mudir' ? 'semua' : newKelas
    });

    if (res.success) {
      setShowUserModal(false);
      setNewUsername('');
      setNewPassword('');
      setUserModalError('');
      fetchData();
    } else {
      setUserModalError(res.message || 'Gagal membuat pengguna.');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak bisa menghapus akun sendiri.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus akun ${u.username} (${u.role})?`)) {
      await dbDeleteUser(u.id);
      fetchData();
    }
  };

  const handleAssignTeacherClass = async (e) => {
    e.preventDefault();
    const teacher = users.find(u => u.id === selectedTeacher);
    if (!teacher) return;

    await dbAssignTeacherClass(teacher.id, teacher.username, assignClass);
    setShowAssignModal(false);
    fetchData();
  };

  const handleRemoveTeacherClass = async (teacherId, kelas) => {
    if (window.confirm(`Hapus pengampuan Kelas ${kelas} untuk guru ini?`)) {
      await dbRemoveTeacherClass(teacherId, kelas);
      fetchData();
    }
  };

  const openGradingModal = (sub) => {
    setGradingSub(sub);
    setGradeInput(sub.grade || '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradeInput.trim()) {
      alert('Nilai wajib diisi!');
      return;
    }

    setSavingGrade(true);
    // Grade as logged-in user (acting in teacher capacity)
    await dbGradeSubmission(
      gradingSub.id,
      gradeInput.trim(),
      feedbackInput.trim(),
      currentUser.id,
      currentUser.username
    );
    setSavingGrade(false);
    setGradingSub(null);
    fetchData();
  };

  // Group teachers and their assigned classes
  const teachersList = users.filter(u => u.role === 'guru' || u.role === 'mudir');

  return (
    <div className="space-y-4">
      {/* Mudir Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="bg-purple-800 text-purple-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Kepala Sekolah / Mudir
            </span>
            <h2 className="text-lg font-bold mt-1">Assalamu'alaikum, Ustadz {currentUser.username}!</h2>
            <p className="text-xs text-purple-200 mt-0.5">Manajemen User, Pengampu Kelas, & Penilaian Seluruh Sekolah.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-purple-950/60 p-1 rounded-xl mt-4 text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-purple-200 hover:text-white'
            }`}
          >
            Pengguna ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'teachers' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-purple-200 hover:text-white'
            }`}
          >
            Pengampu Kelas
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'grading' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-purple-200 hover:text-white'
            }`}
          >
            Penilaian Tugas ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('as_santri')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'as_santri' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-purple-200 hover:text-white'
            }`}
          >
            Setoran Saya
          </button>
        </div>
      </div>

      {/* TAB 1: MANAJEMEN USER */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Filter User:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
              >
                <option value="ALL">Semua Role</option>
                <option value="santri">Santri</option>
                <option value="guru">Guru</option>
                <option value="mudir">Mudir</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowUserModal(true);
                setUserModalError('');
              }}
              className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah User</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 font-bold rounded-full flex items-center justify-center ${
                    u.role === 'mudir' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'guru' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-sm">{u.username}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                        u.role === 'mudir' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'guru' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Password: <span className="font-mono text-slate-600">{u.password}</span> | Kelas: <span className="font-bold">{u.kelas}</span>
                    </p>
                  </div>
                </div>

                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    title="Hapus User"
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PENGAMPU KELAS GURU */}
      {activeTab === 'teachers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-800">Daftar Guru & Penugasan Kelas</h3>
            <button
              onClick={() => {
                if (teachersList.length > 0) setSelectedTeacher(teachersList[0].id);
                setShowAssignModal(true);
              }}
              className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengampu Kelas</span>
            </button>
          </div>

          <div className="space-y-3">
            {teachersList.map((t) => {
              const assigned = teacherClasses.filter(tc => tc.teacher_id === t.id);
              return (
                <div key={t.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full flex items-center justify-center">
                        {t.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{t.username}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-700 mb-1.5">Kelas yang Diampu:</p>
                    {assigned.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Belum disetting khusus (Default Kelas {t.kelas})</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assigned.map((tc) => (
                          <span
                            key={tc.id}
                            className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border border-blue-200"
                          >
                            <span>Kelas {tc.kelas} ({tc.academic_year})</span>
                            <button
                              onClick={() => handleRemoveTeacherClass(t.id, tc.kelas)}
                              className="text-blue-500 hover:text-red-600 rounded cursor-pointer"
                              title="Hapus Kelas"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PENILAIAN SELURUH KELAS */}
      {activeTab === 'grading' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Filter Kelas:</span>
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="ALL">Seluruh Kelas</option>
              <option value="1">Kelas 1</option>
              <option value="2">Kelas 2</option>
              <option value="3">Kelas 3</option>
            </select>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              Tidak ada tugas di kelas ini.
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Kelas {sub.kelas}
                      </span>
                      <span className="text-xs font-bold text-purple-900">
                        Santri: {sub.student_username}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{sub.description || 'Tanpa keterangan'}</p>
                  </div>

                  {sub.grade ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Nilai: {sub.grade}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Belum Dinilai
                    </span>
                  )}
                </div>

                <FilePreview fileUrl={sub.file_url} fileType={sub.file_type} fileName={sub.file_name} />

                {sub.feedback && (
                  <div className="bg-slate-50 border-l-4 border-purple-600 p-3 rounded-r-xl text-xs">
                    <p className="font-bold text-slate-700">Catatan Guru ({sub.graded_by_username || 'Guru'}):</p>
                    <p className="text-slate-600 italic">"{sub.feedback}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Diunggah: {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => openGradingModal(sub)}
                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{sub.grade ? 'Ubah Nilai' : 'Berikan Penilaian'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SETORAN SAYA (MUDIR AS SANTRI) */}
      {activeTab === 'as_santri' && (
        <SantriDashboard currentUser={currentUser} />
      )}

      {/* MODAL USER MANAGEMENT */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Tambah Pengguna Baru
            </h3>

            {userModalError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{userModalError}</p>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="Username..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  placeholder="Password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="santri">Santri</option>
                  <option value="guru">Guru</option>
                  <option value="mudir">Mudir</option>
                </select>
              </div>

              {newRole !== 'mudir' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TEACHER ASSIGNMENT */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Atur Pengampu Kelas Guru
            </h3>

            <form onSubmit={handleAssignTeacherClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Guru</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>{t.username} ({t.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas yang Ditugaskan</label>
                <select
                  value={assignClass}
                  onChange={(e) => setAssignClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tetapkan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GRADING */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 my-8">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Penilaian Tugas: {gradingSub.title} ({gradingSub.student_username})
            </h3>

            <form onSubmit={handleSaveGrade} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Input Nilai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: 95 / A / Sangat Baik"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Evaluasi</label>
                <textarea
                  rows="3"
                  placeholder="Beri catatan/evaluasi..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingGrade ? 'Menyimpan...' : 'Simpan Penilaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
