import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, FolderArchive, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Функция для проверки, активен ли пункт меню
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/teacher', icon: <LayoutDashboard size={20} />, label: 'Дашборд' },
    { path: '/teacher/analytics-global', icon: <BarChart3 size={20} />, label: 'Аналитика' },
    { path: '/teacher/archive', icon: <FolderArchive size={20} />, label: 'Архив' },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-2 rounded-xl font-black text-xl">LL</div>
        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">LiveLec</h1>
      </div>
      
      <nav className="flex flex-col gap-2 px-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              isActive(item.path) 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => navigate('/teacher/settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold mt-auto mb-4 transition-all ${
            isActive('/teacher/settings') 
              ? 'bg-indigo-50 text-indigo-600' 
              : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <Settings size={20} />
          <span>Настройки</span>
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}
          className="flex items-center gap-3 text-rose-400 hover:bg-rose-50 px-4 py-3 rounded-2xl font-bold transition-all mb-8"
        >
          <LogOut size={20} />
          <span>Выйти</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;