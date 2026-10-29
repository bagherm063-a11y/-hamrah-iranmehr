import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminPanel from './AdminPanel';
import AdminSquadPanel from './AdminSquadPanel';
import AdminOperations from './AdminOperations';
import ClubCompanion from './ClubCompanion';
import StaffAndSquad from './StaffAndSquad';
import './index.css';

function Root() {
  const [route, setRoute] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  if (route === '#/admin/squad') return <AdminSquadPanel />;
  if (route === '#/admin/operations') return <AdminOperations />;
  if (route === '#/admin') return <AdminPanel />;
  return <><App /><ClubCompanion /><StaffAndSquad /></>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
