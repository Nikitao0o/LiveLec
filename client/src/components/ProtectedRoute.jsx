import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('unauthorized');
      return;
    }

    api.get('/auth/me')
      .then(() => setStatus('authorized'))
      .catch(() => {
        localStorage.removeItem('token');
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-xs">
        Проверка доступа...
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
