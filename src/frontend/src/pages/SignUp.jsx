import React, { useState } from 'react';
import { registerUser } from '../api';
import { useNavigate } from 'react-router-dom';

const SignUp = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState(''); // Optional for now
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!photo) {
            setError('Please upload a profile photo to continue.');
            return;
        }
        try {
            const user = await registerUser(name, photo);
            onLogin(user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card animate-fade-in">
            <h1>Join the Awards</h1>
            <p>Enter your name to participate.</p>
            {error && <p style={{ color: '#ff4d4d' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Profile Photo (Required)</label>

                    <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        capture="user"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setPhoto(reader.result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />

                    <label
                        htmlFor="photo-upload"
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'background 0.2s',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        {photo ? '📸 Change Photo' : '📸 Choose Photo'}
                    </label>

                    {photo && (
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid var(--primary-color)',
                                boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)'
                            }}>
                                <img src={photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>
                    )}
                </div>
                <button type="submit">Enter</button>
            </form>
        </div>
    );
};

export default SignUp;
