import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';

const TeacherLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-left leading-none">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TeacherLayout;