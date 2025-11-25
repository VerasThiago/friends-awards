import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getStatus } from './api';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Voting from './pages/Voting';
import Results from './pages/Results';

function App() {
  const [user, setUser] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const data = await getStatus();
      setService(data.service);
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && (!service || service.status !== 'finished')) {
        navigate('/signup');
      } else if (window.location.pathname === '/signup') {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/signup" element={<SignUp onLogin={setUser} />} />
      <Route
        path="/"
        element={
          user || (service && service.status === 'finished') ? (
            <Home user={user} service={service} onStart={fetchStatus} />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={user && user.is_admin ? <AdminPanel user={user} service={service} onUpdate={fetchStatus} /> : <Navigate to="/" />}
      />
      <Route
        path="/voting"
        element={user && service.status === 'started' ? <Voting user={user} /> : <Navigate to="/" />}
      />
      <Route
        path="/results"
        element={(user || (service && service.status === 'finished')) ? <Results /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;
