import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import SantriDashboard from './components/SantriDashboard';
import GuruDashboard from './components/GuruDashboard';
import MudirDashboard from './components/MudirDashboard';

const SESSION_KEY = 'hafalan_app_session';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased font-sans">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-12">
        {currentUser.role === 'santri' && <SantriDashboard currentUser={currentUser} />}
        {currentUser.role === 'guru' && <GuruDashboard currentUser={currentUser} />}
        {currentUser.role === 'mudir' && <MudirDashboard currentUser={currentUser} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-400">
        Aplikasi Setoran Hafalan & Tugas &copy; BIIPS Blora
      </footer>
    </div>
  );
}
