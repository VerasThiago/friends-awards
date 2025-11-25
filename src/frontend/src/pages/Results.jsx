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
