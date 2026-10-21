import React, { useState, useEffect } from 'react';
import { PlusCircle, Upload, Edit3, Trash2, CheckCircle2, Clock, FileText, AlertTriangle, Eye, Video, Music, Image as ImageIcon, X } from 'lucide-react';
import { dbGetSubmissions, dbUploadFileToStorage, dbAddSubmission, dbUpdateSubmission, dbDeleteSubmission } from '../services/db';
import FilePreview from './FilePreview';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function SantriDashboard({ currentUser }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileType, setFileType] = useState('document'); // 'video' | 'audio' | 'image' | 'document'
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    const all = await dbGetSubmissions();
    // Filter submissions for current santri
    const userSubs = all.filter(s => s.student_id === currentUser.id || s.student_username === currentUser.username);
    setSubmissions(userSubs);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentUser]);

  // Determine file category based on MIME type / extension
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg('Ukuran file melebihi batas maksimal 10MB!');
      setSelectedFile(null);
      setFilePreviewUrl('');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);

    // Generate local preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    // Detect type
    const mime = file.type;
    if (mime.startsWith('video/')) {
      setFileType('video');
    } else if (mime.startsWith('audio/')) {
      setFileType('audio');
    } else if (mime.startsWith('image/')) {
      setFileType('image');
    } else {
      setFileType('document');
    }
  };

  const openCreateModal = () => {
    setEditingSub(null);
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setFilePreviewUrl('');
    setFileType('document');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (sub) => {
    if (sub.grade) {
      alert('Tugas yang sudah dinilai tidak dapat diedit lagi.');
      return;
    }
    setEditingSub(sub);
    setTitle(sub.title);
    setDescription(sub.description || '');
    setSelectedFile(null);
    setFilePreviewUrl(sub.file_url);
    setFileType(sub.file_type);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Nama hafalan / tugas wajib diisi!');
      return;
    }

    if (!editingSub && !selectedFile) {
      setErrorMsg('Berkas file wajib dipilih!');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      let finalFileUrl = filePreviewUrl;
      let finalFileName = editingSub ? editingSub.file_name : selectedFile?.name;

      if (selectedFile) {
        finalFileUrl = await dbUploadFileToStorage(selectedFile);
        finalFileName = selectedFile.name;
      }

      if (editingSub) {
        await dbUpdateSubmission(editingSub.id, {
          title: title.trim(),
          description: description.trim(),
          file_url: finalFileUrl,
          file_type: fileType,
          file_name: finalFileName,
        });
      } else {
        await dbAddSubmission({
          student_id: currentUser.id,
          student_username: currentUser.username,
          title: title.trim(),
          description: description.trim(),
          file_url: finalFileUrl,
          file_type: fileType,
          file_name: finalFileName,
          kelas: currentUser.kelas || '1',
        });
      }

      setShowModal(false);
      fetchSubmissions();
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (sub) => {
    if (sub.grade) {
      alert('Tugas yang sudah dinilai tidak dapat dihapus.');
      return;
    }
    if (window.confirm('Yakin ingin menghapus hafalan/tugas ini?')) {
      await dbDeleteSubmission(sub.id);
      fetchSubmissions();
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div>
          <span className="bg-emerald-600/60 text-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Kelas {currentUser.kelas || '1'}
          </span>
          <h2 className="text-lg font-bold mt-1">Assalamu'alaikum, {currentUser.username}!</h2>
          <p className="text-xs text-emerald-100 mt-0.5">Kelola dan unggah hafalan serta tugas sekolahmu di sini.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-white text-emerald-900 hover:bg-emerald-50 px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-emerald-700" />
          <span>Unggah</span>
        </button>
      </div>

      {/* Submissions List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Daftar Setoran & Tugas ({submissions.length})</span>
        </h3>
      </div>

      {/* Submissions Cards */}
      {loading ? (
        <div className="text-center py-8 text-slate-400 text-xs">Memuat data...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold">Belum ada setoran / tugas yang diunggah.</p>
          <p className="text-[11px] text-slate-400 mt-1">Tekan tombol "Unggah" di atas untuk menambahkan tugas baru.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sub.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{sub.description || 'Tanpa keterangan'}</p>
                </div>
                {/* Status Badge */}
                <div>
                  {sub.grade ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Nilai: {sub.grade}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Belum Dinilai
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Section */}
              <FilePreview fileUrl={sub.file_url} fileType={sub.file_type} fileName={sub.file_name} />

              {/* Teacher Feedback Note if graded */}
              {sub.feedback && (
                <div className="bg-slate-50 border-l-4 border-emerald-500 p-3 rounded-r-xl">
                  <p className="text-[11px] font-bold text-slate-700 mb-0.5">Catatan Ustadz/Ustadzah ({sub.graded_by_username || 'Guru'}):</p>
                  <p className="text-xs text-slate-600 italic">"{sub.feedback}"</p>
                </div>
              )}

              {/* Action Buttons for Santri */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400">
                  {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {!sub.grade ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(sub)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Tugas telah dinilai (terkunci)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSub ? 'Edit Hafalan / Tugas' : 'Unggah Hafalan / Tugas Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Hafalan / Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Misal: Hafalan Surat Al-Mulk ayat 1-10"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows="2"
                  placeholder="Catatan opsional dari santri..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Berkas (Video, Suara, Foto, atau Dokumen PDF/Doc)
                </label>
                <p className="text-[10px] text-slate-400 mb-1.5">Maksimal ukuran file: 10MB</p>
                <input
                  type="file"
                  accept="video/*,audio/*,image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Instant Live Preview */}
              {filePreviewUrl && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" /> Pratinjau Berkas:
                  </p>
                  <FilePreview fileUrl={filePreviewUrl} fileType={fileType} fileName={selectedFile?.name || editingSub?.file_name} />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editingSub ? 'Simpan Perubahan' : 'Unggah Tugas'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
