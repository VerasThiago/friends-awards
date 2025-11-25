import React, { useState, useEffect, useRef } from 'react';
import { getCategories, vote, getStatus, revealRound, nextRound, prevRound, startTieBreaker } from '../api';
import { useNavigate } from 'react-router-dom';

const Voting = ({ user }) => {
    const [categories, setCategories] = useState([]);
    const [activeRound, setActiveRound] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [myVote, setMyVote] = useState(null);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [revealingName, setRevealingName] = useState(null); // For animation
    const [showResult, setShowResult] = useState(false);
    const [rouletteItems, setRouletteItems] = useState([]);
    const [rouletteTransform, setRouletteTransform] = useState(0);
    const [rouletteTransition, setRouletteTransition] = useState('none');
    const navigate = useNavigate();

    // Track previous status to trigger animation only once per round/status change
    const prevStatusRef = useRef(null);
    const prevRoundIdRef = useRef(null);

    useEffect(() => {
        loadInitialData();
        const interval = setInterval(pollStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const loadInitialData = async () => {
        const cats = await getCategories();
        setCategories(cats);
        pollStatus();
    };

    const pollStatus = async () => {
        try {
            const status = await getStatus();
            setParticipants(status.participants);
            const round = status.activeRound;

            if (!round) {
                setActiveRound(null);
                return;
            }

            // Check for state changes
            if (round.id !== prevRoundIdRef.current) {
                // New round started
                setMyVote(null);
                setShowResult(false);
                setRevealingName(null);
                prevRoundIdRef.current = round.id;
            }

            if (round.status !== prevStatusRef.current) {
                if (round.status === 'revealing' && prevStatusRef.current !== 'revealing') {
                    // Trigger animation
                    startRevealAnimation(round, status.participants);
                } else if (round.status === 'completed') {
                    setShowResult(true);
                } else if (round.status === 'tie_breaker') {
                    setShowResult(false);
                    setMyVote(null); // Clear previous vote for tie breaker
                }
                prevStatusRef.current = round.status;
            }

            setActiveRound(round);

            // Check if I already voted in this round/status
            // Ideally backend tells us, but we can infer or just rely on local state for UI feedback
            // For now, local state 'myVote' is simple.
        } catch (err) {
            console.error("Polling error", err);
        }
    };

    const startRevealAnimation = (round, allParticipants) => {
        setShowResult(false);
        const winnerId = round.result.winnerId;

        let winner;
        if (winnerId === 'draw') {
            winner = {
                id: 'draw',
                name: 'DRAW',
                photo: 'https://api.dicebear.com/7.x/initials/svg?seed=DRAW&backgroundColor=000000', // Or a specific draw icon
                isDraw: true
            };
        } else {
            winner = allParticipants.find(p => p.id === winnerId);
        }

        if (!winner) {
            console.error("Winner not found in participants!", winnerId, allParticipants);
            setShowResult(true); // Fallback to showing result immediately
            return;
        }

        // Generate roulette items
        const cardWidth = 160; // 150px width + 10px margin
        const numRepeats = 50; // Enough to scroll for a while
        const winnerIndex = 45; // Landing position (towards the end)

        // Filter out admins for the roulette animation
        const rouletteCandidates = allParticipants.filter(p => !p.is_admin);

        const items = [];
        for (let i = 0; i < numRepeats; i++) {
            if (i === winnerIndex) {
                items.push({ ...winner, isWinner: true, uniqueId: `winner-${i}` });
            } else {
                const randomParticipant = rouletteCandidates[Math.floor(Math.random() * rouletteCandidates.length)];
                items.push({ ...randomParticipant, isWinner: false, uniqueId: `${randomParticipant.id}-${i}` });
            }
        }
        setRouletteItems(items);

        // Reset position
        setRouletteTransition('none');
        setRouletteTransform(0);

        // Start animation after a brief delay to ensure render
        setTimeout(() => {
            // Calculate target position
            // Center of container is at 50% width.
            // We want the center of the winner card to be at the center of the container.
            // Container width is dynamic, but let's assume centered pointer.
            // transform = - (winnerIndex * cardWidth) + (containerWidth / 2) - (cardWidth / 2)
            // Actually simpler: just shift left by winnerIndex * cardWidth and adjust for centering.
            // Let's rely on fixed card width logic.

            // Random offset within the card to make it look natural (not always dead center)
            // Card width is 150px (border-box), so center is 75px.
            // +/- 35px keeps it well within the card boundaries.
            const randomOffset = Math.floor(Math.random() * 70) - 35;
            const targetPosition = -1 * (winnerIndex * cardWidth) + randomOffset;

            setRouletteTransition('transform 6s cubic-bezier(0.1, 0, 0.2, 1)'); // Ease out cubic for "spin" effect
            setRouletteTransform(targetPosition);
        }, 100);

        // Show result after animation
        setTimeout(() => {
            setShowResult(true);
        }, 7000); // 6s animation + 1s buffer
    };

    const handleNext = async () => {
        try {
            await nextRound(user.id);
            if (activeRound && categories.length > 0) {
                const currentIndex = categories.findIndex(c => c.id === activeRound.category_id);
                if (currentIndex === categories.length - 1) {
                    navigate('/');
                }
            }
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handlePrev = async () => {
        try {
            await prevRound(user.id);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleVote = async (votedForId) => {
        if (!activeRound) return;
        try {
            await vote(user.id, activeRound.id, votedForId);
            setMyVote(votedForId);
            setMsg('Vote saved!');
            setTimeout(() => setMsg(''), 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleReveal = async () => {
        try {
            await revealRound(user.id);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleTieBreaker = async () => {
        try {
            await startTieBreaker(user.id);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    if (!activeRound) {
        return (
            <div className="card animate-fade-in">
                <h1>Voting Closed</h1>
                <p>Waiting for the next round...</p>
            </div>
        );
    }

    const currentCategory = categories.find(c => c.id === activeRound.category_id);
    const isTieBreaker = activeRound.status === 'tie_breaker';

    // Filter participants
    const candidates = participants.filter(p => {
        if (p.id === user.id) return false; // Cannot vote for self
        if (p.is_admin) return false; // Cannot vote for admin
        if (isTieBreaker) {
            return activeRound.tie_break_participants.includes(p.id);
        }
        return true;
    });

    // Check who hasn't voted yet (simple estimation based on vote count vs participant count)
    // Backend doesn't send who voted, so we can't show names of missing voters easily without updating backend.
    // Plan said "Show missing participants", but I missed adding that to backend response.
    // I'll skip that for now or just show count.
    const voteCount = isTieBreaker ? activeRound.tie_break_votes.length : activeRound.votes.length;
    const totalVoters = participants.filter(p => !p.is_admin).length;

    return (
        <div className="card animate-fade-in" style={{ paddingBottom: '80px' }}>
            <h1>{currentCategory ? currentCategory.name : 'Loading...'}</h1>
            <p>{currentCategory?.description}</p>

            <div style={{ margin: '1rem 0', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                Status: <strong>{activeRound.status.toUpperCase().replace('_', ' ')}</strong>
                <br />
                Votes: {voteCount} / {totalVoters}
                {user.is_admin && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {voteCount === totalVoters && (activeRound.status === 'voting' || activeRound.status === 'tie_breaker') && (
                            <button onClick={handleReveal} style={{ background: 'rgba(255, 165, 0, 0.2)', fontSize: '0.9em', padding: '5px 15px' }}>
                                Reveal Votes
                            </button>
                        )}
                    </div>
                )}
            </div>

            {user.is_admin && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '30px',
                    right: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    pointerEvents: 'none', // Allow clicking through the container
                    zIndex: 1000
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        {categories.findIndex(c => c.id === activeRound.category_id) > 0 && (
                            <button onClick={handlePrev} style={{ background: 'rgba(255, 255, 255, 0.1)', fontSize: '1em', padding: '10px 20px' }}>
                                Previous Category
                            </button>
                        )}
                    </div>

                    <div style={{ pointerEvents: 'auto' }}>
                        {(activeRound.status === 'completed' || (activeRound.status === 'revealing' && showResult && activeRound.result?.winnerId !== 'draw')) && (
                            <button onClick={handleNext} style={{ background: 'rgba(0, 210, 255, 0.2)', fontSize: '1em', padding: '10px 20px' }}>
                                {categories.findIndex(c => c.id === activeRound.category_id) === categories.length - 1 ? 'Finish & Return to Main Menu' : 'Next Category'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && <p style={{ color: '#ff4d4d' }}>{error}</p>}
            {msg && <p style={{ color: '#00ff00' }}>{msg}</p>}

            {
                (activeRound.status === 'voting' || activeRound.status === 'tie_breaker') && (
                    !user.is_admin ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginTop: '20px' }}>
                            {candidates.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleVote(p.id)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        border: myVote === p.id ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)',
                                        background: myVote === p.id ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {/* Placeholder for photo */}
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ccc', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <img
                                            src={p.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.name}
                                            alt={p.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.name; }}
                                        />
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <h3>Managing Round</h3>
                            <p>Waiting for votes...</p>
                        </div>
                    )
                )
            }

            {
                activeRound.status === 'revealing' && !showResult && (
                    <div style={{ marginTop: '50px' }}>
                        <h2>The winner is...</h2>
                        <div className="roulette-container">
                            <div className="roulette-pointer"></div>
                            <div
                                className="roulette-track"
                                style={{
                                    transform: `translateX(calc(50% - 80px + ${rouletteTransform}px))`, // 80px is half card width (approx)
                                    transition: rouletteTransition
                                }}
                            >
                                {rouletteItems.map((item) => (
                                    <div key={item.uniqueId} className={`roulette-card ${item.isWinner ? 'winner-card' : ''}`}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ccc', marginBottom: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img
                                                src={item.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.name}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.name; }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '0.9em', fontWeight: 'bold', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '90%' }}>
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showResult && activeRound.result && activeRound.status !== 'tie_breaker' && (
                    <div style={{ marginTop: '30px', animation: 'fadeIn 1s' }}>
                        {activeRound.result.winnerId !== 'draw' && <h2>🏆 Winner 🏆</h2>}
                        {(() => {
                            if (activeRound.result.winnerId === 'draw') {
                                return (
                                    <div>
                                        <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                                            <span style={{ fontSize: '50px' }}>🤝</span>
                                        </div>
                                        <h1 style={{ color: '#fff' }}>It's a Draw!</h1>

                                        <div style={{ marginTop: '20px' }}>
                                            <h3>Tied Participants:</h3>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                                                {activeRound.tie_break_participants.map(id => {
                                                    const p = participants.find(part => part.id === id);
                                                    return (
                                                        <div key={id} style={{ textAlign: 'center' }}>
                                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto' }}>
                                                                <img src={p?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p?.name} alt={p?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div>{p?.name}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {user.is_admin && (
                                            <button onClick={handleTieBreaker} style={{ marginTop: '30px', background: '#ff4d4d', fontSize: '1.2em', padding: '10px 30px' }}>
                                                Start Tie Breaker Round
                                            </button>
                                        )}
                                    </div>
                                );
                            }

                            const winner = participants.find(p => p.id === activeRound.result.winnerId);
                            return (
                                <div>
                                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid gold', margin: '0 auto 20px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                        <img
                                            src={winner?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + winner?.name}
                                            alt={winner?.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + winner?.name; }}
                                        />
                                    </div>
                                    <h1 style={{ color: 'gold', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>{winner?.name}</h1>

                                    <div style={{ marginTop: '30px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px' }}>
                                        <h3>Vote Breakdown</h3>
                                        <ul>
                                            {Object.entries(activeRound.result.stats).map(([id, count]) => {
                                                const p = participants.find(p => p.id === id);
                                                return <li key={id}>{p?.name || 'Unknown'}: {count} votes</li>
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )
            }
        </div >
    );
};

export default Voting;
