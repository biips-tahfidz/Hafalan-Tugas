import React, { useState } from 'react';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { dbLogin } from '../services/db';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await dbLogin(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Username atau password salah.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-gradient-to-b from-blue-900 to-indigo-900 p-6 text-center text-white">
          <div className="relative inline-block mb-3">
            <img
              src="/logo.jpg"
              alt="Logo BIIPS"
              className="w-24 h-24 object-contain rounded-full border-4 border-white shadow-md mx-auto bg-white p-1"
            />
          </div>
          <h1 className="text-lg font-bold tracking-wide uppercase">Bina Ilmu Islamic</h1>
          <p className="text-xs text-blue-200 font-medium">Primary School (BIIPS) Blora</p>
          <div className="mt-3 inline-block bg-blue-800/80 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-semibold text-blue-100">
            Aplikasi Setoran Hafalan & Tugas
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-center font-bold text-slate-800 text-base mb-2">Masuk ke Akun Anda</h2>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} BIIPS Blora - Jawa Tengah
          </div>
        </form>
      </div>
    </div>
  );
}
