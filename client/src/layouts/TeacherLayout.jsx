import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const TeacherLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-left leading-none">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl overflow-y-auto">
        {/* Outlet — это место, куда React Router будет подставлять текущую страницу */}
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;