import React from 'react';
import { LogOut, User, BookOpen, ShieldCheck, GraduationCap } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  if (!currentUser) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'mudir':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Mudir</span>;
      case 'guru':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Guru</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><BookOpen className="w-3 h-3" /> Santri</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="BIIPS Logo"
            className="w-10 h-10 object-contain rounded-full border border-blue-900/20 shadow-xs"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">BINA ILMU ISLAMIC</h1>
            <p className="text-[10px] text-slate-500 font-medium">PRIMARY SCHOOL (BIIPS)</p>
          </div>
        </div>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
              <User className="w-3 h-3 text-slate-400" />
              <span>{currentUser.username}</span>
            </div>
            <div className="mt-0.5 flex justify-end">
              {getRoleBadge(currentUser.role)}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 ml-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
