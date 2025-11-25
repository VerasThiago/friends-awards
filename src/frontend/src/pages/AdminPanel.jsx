import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, startService, revealRound, nextRound, prevRound, getStatus } from '../api';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user, service, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [error, setError] = useState('');
    const [activeRound, setActiveRound] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.is_admin) {
            navigate('/');
            return;
        }
        loadData();
        const interval = setInterval(loadData, 2000); // Poll for status updates
        return () => clearInterval(interval);
    }, [user, navigate]);

    const loadData = async () => {
        const [cats, status] = await Promise.all([getCategories(), getStatus()]);
        setCategories(cats);
        setActiveRound(status.activeRound);
        setParticipants(status.participants);
        // Update global service state if needed, but we are using local activeRound for controls
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await addCategory(user.id, newCatName, newCatDesc);
            setNewCatName('');
            setNewCatDesc('');
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStart = async (action = null) => {
        try {
            await startService(user.id, action);
            setShowConflictDialog(false);
            onUpdate();
            navigate('/voting');
        } catch (err) {
            if (err.code === 'EXISTING_ROUNDS') {
                setShowConflictDialog(true);
            } else {
                setError(err.message);
            }
        }
    };

    const handleReveal = async () => {
        try {
            await revealRound(user.id);
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleNext = async () => {
        try {
            await nextRound(user.id);
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePrev = async () => {
        try {
            await prevRound(user.id);
            loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card animate-fade-in">
            <h1>Admin Panel</h1>
            <p>Manage categories and control the flow.</p>

            {service.status === 'not_started' && (
                <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                    <h3>Add Category</h3>
                    <form onSubmit={handleAddCategory}>
                        <input
                            type="text"
                            placeholder="Category Name"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newCatDesc}
                            onChange={(e) => setNewCatDesc(e.target.value)}
                        />
                        <button type="submit">Add Category</button>
                    </form>
                    {error && <p style={{ color: '#ff4d4d' }}>{error}</p>}
                </div>
            )}

            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <h3>Current Categories</h3>
                <ul>
                    {categories.map(c => (
                        <li key={c.id}><strong>{c.name}</strong>: {c.description}</li>
                    ))}
                </ul>
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                {service.status === 'not_started' && (
                    <button onClick={() => handleStart()} style={{ width: '100%', background: 'rgba(0, 255, 0, 0.2)' }}>
                        Start Awards
                    </button>
                )}

                {showConflictDialog && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <h3>Existing Data Found</h3>
                            <p>There are existing rounds in the database. How would you like to proceed?</p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                                <button onClick={() => handleStart('backup')} style={{ background: 'rgba(0, 200, 255, 0.3)' }}>
                                    Backup & Start
                                </button>
                                <button onClick={() => handleStart('overwrite')} style={{ background: 'rgba(255, 50, 50, 0.3)' }}>
                                    Overwrite
                                </button>
                            </div>
                            <button onClick={() => setShowConflictDialog(false)} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#aaa' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {service.status === 'started' && activeRound && (
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <h3>Current Round: {categories.find(c => c.id === activeRound.category_id)?.name}</h3>
                        <p>Status: <strong>{activeRound.status}</strong></p>

                        {(activeRound.status === 'voting' || activeRound.status === 'tie_breaker') && (
                            <div>
                                {(() => {
                                    const isTieBreaker = activeRound.status === 'tie_breaker';
                                    const voteCount = isTieBreaker ? activeRound.tie_break_votes.length : activeRound.votes.length;
                                    const totalVoters = participants.length;
                                    const allVoted = voteCount === totalVoters;

                                    return (
                                        <>
                                            <p>Votes: {voteCount} / {totalVoters}</p>
                                            {allVoted ? (
                                                <button onClick={handleReveal} style={{ background: 'rgba(255, 165, 0, 0.2)' }}>
                                                    Reveal Votes
                                                </button>
                                            ) : (
                                                <p style={{ fontStyle: 'italic', color: '#aaa' }}>Waiting for all votes...</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {(activeRound.status === 'revealing' || activeRound.status === 'completed') && (
                            <button onClick={handleNext} style={{ background: 'rgba(0, 210, 255, 0.2)' }}>
                                Next Category
                            </button>
                        )}

                        {/* Previous Button - Show if not the first category */}
                        {categories.findIndex(c => c.id === activeRound.category_id) > 0 && (
                            <button onClick={handlePrev} style={{ background: 'rgba(255, 255, 255, 0.1)', marginTop: '10px' }}>
                                Previous Category
                            </button>
                        )}
                    </div>
                )}

                {service.status === 'finished' && (
                    <div>
                        <h2>Awards Finished! 🏆</h2>
                        <button onClick={handlePrev} style={{ background: 'rgba(255, 255, 255, 0.1)', marginTop: '10px' }}>
                            Previous Category
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
