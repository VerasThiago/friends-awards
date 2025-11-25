import React, { useEffect, useState } from 'react';
import { getResults } from '../api';
import { useNavigate } from 'react-router-dom';

const Results = () => {
    const [data, setData] = useState(null);
    const [visibleCategories, setVisibleCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await getResults();
                // Filter out admins from participants list
                results.participants = results.participants.filter(p => !p.is_admin);

                // Calculate Statistics
                const winCounts = {};
                const voteCounts = {};

                results.rounds.forEach(round => {
                    // Count Wins
                    if (round.result && round.result.winnerId) {
                        winCounts[round.result.winnerId] = (winCounts[round.result.winnerId] || 0) + 1;
                    }

                    // Count Votes
                    if (round.result && round.result.stats) {
                        Object.entries(round.result.stats).forEach(([participantId, count]) => {
                            voteCounts[participantId] = (voteCounts[participantId] || 0) + count;
                        });
                    }
                });

                // Find Biggest Winner
                let maxWins = 0;
                let biggestWinnerId = null;
                Object.entries(winCounts).forEach(([id, count]) => {
                    if (count > maxWins) {
                        maxWins = count;
                        biggestWinnerId = id;
                    }
                });

                // Find Most Voted
                let maxVotes = 0;
                let mostVotedId = null;
                Object.entries(voteCounts).forEach(([id, count]) => {
                    if (count > maxVotes) {
                        maxVotes = count;
                        mostVotedId = id;
                    }
                });

                const biggestWinner = results.participants.find(p => p.id === biggestWinnerId);
                const mostVoted = results.participants.find(p => p.id === mostVotedId);

                if (biggestWinner) {
                    results.stats = {
                        biggestWinner: { ...biggestWinner, count: maxWins },
                        mostVoted: mostVoted ? { ...mostVoted, count: maxVotes } : null
                    };
                }

                setData(results);

                // Animate categories appearing one by one
                results.categories.forEach((_, index) => {
                    setTimeout(() => {
                        setVisibleCategories(prev => [...prev, index]);
                    }, index * 2000 + 1000); // Start after 1s, then every 2s
                });
            } catch (err) {
                console.error("Failed to fetch results", err);
            }
        };
        fetchData();
    }, []);

    if (!data) {
        return <div className="card">Loading Results...</div>;
    }

    return (
        <div className="results-container">
            <div className="thank-you-section animate-fade-in">
                <h1 className="rainbow-text">Thank You for Participating!</h1>
                <p>What an incredible edition of Friends Awards!</p>

                <div className="participants-grid">
                    {data.participants.map((p, i) => (
                        <div key={p.id} className="participant-bubble" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="participant-photo">
                                <img
                                    src={p.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.name}
                                    alt={p.name}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.name; }}
                                />
                            </div>
                            <div className="participant-name">{p.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {data.stats && (
                <div className="stats-section animate-fade-in" style={{ animationDelay: '0.5s', marginBottom: '40px' }}>
                    <h2 className="section-title">Highlights</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>🏆 Biggest Winner</h3>
                            <div className="stat-content">
                                <div className="winner-photo-large">
                                    <img
                                        src={data.stats.biggestWinner.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.stats.biggestWinner.name}
                                        alt={data.stats.biggestWinner.name}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.stats.biggestWinner.name; }}
                                    />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-name">{data.stats.biggestWinner.name}</div>
                                    <div className="stat-value">{data.stats.biggestWinner.count} Awards</div>
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <h3>⭐ Most Voted</h3>
                            <div className="stat-content">
                                <div className="winner-photo-large">
                                    <img
                                        src={data.stats.mostVoted.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.stats.mostVoted.name}
                                        alt={data.stats.mostVoted.name}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.stats.mostVoted.name; }}
                                    />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-name">{data.stats.mostVoted.name}</div>
                                    <div className="stat-value">{data.stats.mostVoted.count} Votes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="winners-section">
                <h2>And the winners are...</h2>
                <div className="categories-list">
                    {data.categories.map((category, index) => {
                        const round = data.rounds.find(r => r.category_id === category.id);
                        const winnerId = round?.result?.winnerId;
                        const winner = data.participants.find(p => p.id === winnerId);
                        const isVisible = visibleCategories.includes(index);

                        return (
                            <div
                                key={category.id}
                                className={`result-card ${isVisible ? 'visible' : ''}`}
                            >
                                <h3>{category.name}</h3>
                                {isVisible ? (
                                    <div className="winner-reveal animate-pop-in">
                                        <div className="winner-photo-large">
                                            <img
                                                src={winner?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + winner?.name}
                                                alt={winner?.name}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + winner?.name; }}
                                            />
                                        </div>
                                        <div className="winner-name">{winner?.name || 'No Winner'}</div>
                                    </div>
                                ) : (
                                    <div className="winner-placeholder">
                                        ???
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
        </div>
    );
};

export default Results;
