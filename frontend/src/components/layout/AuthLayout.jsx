import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        {/* Hospital branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 shadow-2xl border border-white/20"
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            YFM General Hospital
          </h1>
          <p className="text-blue-300 text-sm mt-1 font-medium">Hospital Management System</p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-white/10 p-8 backdrop-blur animate-slide-up">
          <Outlet />
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          © {new Date().getFullYear()} Yohannes Fantaye Metasebiya General Hospital PLC
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
