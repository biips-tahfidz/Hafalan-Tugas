import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Award, Users, Plus, Trash2, Filter, UserCheck, MessageSquare, Edit, Upload } from 'lucide-react';
import { dbGetSubmissions, dbGetUsers, dbGetTeacherClasses, dbGradeSubmission, dbAddUser, dbDeleteUser, dbUpdateUserClass } from '../services/db';
import FilePreview from './FilePreview';
import SantriDashboard from './SantriDashboard';

export default function GuruDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('grading'); // 'grading' | 'students' | 'as_santri'
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Grading State
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Student Management Form
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('1');
  const [addStudentError, setAddStudentError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    // Get teacher's assigned classes
    const tcList = await dbGetTeacherClasses(currentUser.id);
    const classes = tcList.map(t => t.kelas);

    // Fallback if no specific entry found in teacher_classes: check currentUser.kelas
    if (classes.length === 0 && currentUser.kelas && currentUser.kelas !== 'semua') {
      classes.push(currentUser.kelas);
    }
    setAssignedClasses(classes);

    // Default class filter to first assigned class or 'ALL'
    if (classes.length > 0 && selectedClassFilter === 'ALL') {
      setSelectedClassFilter(classes[0]);
    }

    // Get all submissions
    const allSubs = await dbGetSubmissions();
    setSubmissions(allSubs);

    // Get all users (filter for santri in assigned classes)
    const allUsers = await dbGetUsers();
    setStudents(allUsers.filter(u => u.role === 'santri'));

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Submissions filtered by teacher's classes
  const filteredSubmissions = submissions.filter(sub => {
    if (assignedClasses.length > 0 && !assignedClasses.includes(sub.kelas) && currentUser.role !== 'mudir') {
      return false;
    }
    if (selectedClassFilter !== 'ALL' && sub.kelas !== selectedClassFilter) {
      return false;
    }
    return true;
  });

  // Students filtered by assigned classes
  const filteredStudents = students.filter(st => {
    if (assignedClasses.length > 0 && !assignedClasses.includes(st.kelas) && currentUser.role !== 'mudir') {
      return false;
    }
    if (selectedClassFilter !== 'ALL' && st.kelas !== selectedClassFilter) {
      return false;
    }
    return true;
  });

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
    // Submit grade without modifying user role context (remains logged-in user)
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

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentUsername || !newStudentPassword) {
      setAddStudentError('Username dan password wajib diisi!');
      return;
    }

    const res = await dbAddUser({
      username: newStudentUsername,
      password: newStudentPassword,
      role: 'santri',
      kelas: newStudentClass
    });

    if (res.success) {
      setShowAddStudentModal(false);
      setNewStudentUsername('');
      setNewStudentPassword('');
      setAddStudentError('');
      fetchData();
    } else {
      setAddStudentError(res.message || 'Gagal menambahkan santri.');
    }
  };

  const handleRemoveStudent = async (st) => {
    if (window.confirm(`Yakin ingin mengeluarkan santri ${st.username} dari Kelas ${st.kelas}?`)) {
      await dbDeleteUser(st.id);
      fetchData();
    }
  };

  const handleChangeStudentClass = async (st, newClass) => {
    await dbUpdateUserClass(st.id, newClass);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Teacher Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-800 text-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Ustadz / Ustadzah
              </span>
              <span className="text-xs text-blue-300 font-medium">
                Mengampu Kelas: {assignedClasses.length > 0 ? assignedClasses.map(c => `Kelas ${c}`).join(', ') : 'Semua Kelas'}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1">Assalamu'alaikum, Ustadz/ah {currentUser.username}!</h2>
            <p className="text-xs text-blue-200 mt-0.5">Penilaian Hafalan, Tugas Santri & Pengelolaan Kelas.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-blue-950/60 p-1 rounded-xl mt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('grading')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'grading' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Penilaian Tugas ({filteredSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'students' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Kelola Santri ({filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('as_santri')}
            className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'as_santri' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Setoran Saya
          </button>
        </div>
      </div>

      {/* Class Selector Filter */}
      {activeTab !== 'as_santri' && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Filter Kelas:</span>
          </div>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Kelas Ampuan</option>
            {assignedClasses.map(c => (
              <option key={c} value={c}>Kelas {c}</option>
            ))}
            <option value="1">Kelas 1</option>
            <option value="2">Kelas 2</option>
            <option value="3">Kelas 3</option>
          </select>
        </div>
      )}

      {/* TAB 1: SUBMISSIONS GRADING */}
      {activeTab === 'grading' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Memuat setoran...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Tidak ada setoran / tugas di kelas ini.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Kelas {sub.kelas}
                      </span>
                      <span className="text-xs font-bold text-blue-900">
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

                {/* File Preview */}
                <FilePreview fileUrl={sub.file_url} fileType={sub.file_type} fileName={sub.file_name} />

                {/* Graded info / note */}
                {sub.feedback && (
                  <div className="bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r-xl text-xs">
                    <p className="font-bold text-slate-700">Catatan Guru ({sub.graded_by_username || 'Guru'}):</p>
                    <p className="text-slate-600 italic">"{sub.feedback}"</p>
                  </div>
                )}

                {/* Action button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Diunggah: {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => openGradingModal(sub)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{sub.grade ? 'Ubah Nilai / Catatan' : 'Berikan Penilaian'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: KELOLA SANTRI */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-800">Daftar Santri Terdaftar</h3>
            <button
              onClick={() => {
                setShowAddStudentModal(true);
                setNewStudentClass(selectedClassFilter !== 'ALL' ? selectedClassFilter : '1');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Santri</span>
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              Tidak ada santri di kelas ini.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
              {filteredStudents.map((st) => (
                <div key={st.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-50 text-blue-800 font-bold rounded-full flex items-center justify-center">
                      {st.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{st.username}</p>
                      <p className="text-[10px] text-slate-400">Password: {st.password}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Change Class Dropdown */}
                    <select
                      value={st.kelas}
                      onChange={(e) => handleChangeStudentClass(st, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700"
                    >
                      <option value="1">Kelas 1</option>
                      <option value="2">Kelas 2</option>
                      <option value="3">Kelas 3</option>
                    </select>

                    <button
                      onClick={() => handleRemoveStudent(st)}
                      title="Keluarkan Santri"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETORAN SAYA (GURU AS SANTRI) */}
      {activeTab === 'as_santri' && (
        <SantriDashboard currentUser={currentUser} />
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
                  placeholder="Misal: 95 / A / Sangat Baik / Mumtaz"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Evaluasi Guru</label>
                <textarea
                  rows="3"
                  placeholder="Beri apresiasi atau koreksi tajwid/bacaan..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingGrade ? 'Menyimpan...' : 'Simpan Penilaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Tambah Santri Baru
            </h3>

            {addStudentError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{addStudentError}</p>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username Santri</label>
                <input
                  type="text"
                  placeholder="Misal: ahmad"
                  value={newStudentUsername}
                  onChange={(e) => setNewStudentUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  placeholder="Misal: ahmad123"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Kelas</label>
                <select
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
