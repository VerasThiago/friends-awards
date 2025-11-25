import React, { useState } from 'react';
import { startService } from '../api';
import { useNavigate } from 'react-router-dom';

const Home = ({ user, service, onStart }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleStart = async () => {
        setLoading(true);
        try {
            await startService(user.id);
            onStart(); // Refresh state
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in">
            <h1>Mãe Awards 2025</h1>
            {user ? <p>Welcome, <strong>{user.name}</strong>!</p> : <p>Welcome, Guest!</p>}

            {service.status === 'finished' ? (
                <div>
                    <h2>The Awards are Over!</h2>
                    <p>Check out the winners!</p>
                    <button
                        onClick={() => navigate('/results')}
                        style={{ background: 'linear-gradient(45deg, #ff00cc, #3333ff)', border: 'none' }}
                    >
                        View Results 🏆
                    </button>
                </div>
            ) : service.status === 'started' ? (
                <div>
                    <h2>Voting is Open!</h2>
                    <p>Go cast your votes!</p>
                    <button onClick={() => navigate('/voting')}>Go to Voting</button>
                </div>
            ) : (
                <div>
                    <p>The awards haven't started yet.</p>
                    {user && user.is_admin ? (
                        <div>
                            <button onClick={() => navigate('/admin')}>Admin Panel</button>
                            <p style={{ fontSize: '0.8em', marginTop: '10px' }}>Go to Admin Panel to manage categories and start the awards.</p>
                        </div>
                    ) : (
                        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            Waiting for Admin to Start
                        </button>
                    )}
                    {error && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{error}</p>}
                </div>
            )}
        </div>
    );
};

export default Home;
