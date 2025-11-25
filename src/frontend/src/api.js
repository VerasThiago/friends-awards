const API_URL = '/api'; // Relative path for monolith

export const getStatus = async () => {
    const response = await fetch(`${API_URL}/status`);
    return response.json();
};

export const getResults = async () => {
    const response = await fetch(`${API_URL}/results`);
    return response.json();
};

export const registerUser = async (name, photo) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, photo }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
};

export const startService = async (userId, action = null) => {
    const body = { userId };
    if (action) body.action = action;

    const response = await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        const err = new Error(error.error || 'Failed to start service');
        if (error.code) err.code = error.code;
        throw err;
    }
    return response.json();
};

export const getCategories = async () => {
    const response = await fetch(`${API_URL}/categories`);
    return response.json();
};

export const addCategory = async (userId, name, description) => {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, name, description }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add category');
    }
    return response.json();
};

export const vote = async (voterId, roundId, votedForId) => {
    const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voterId, roundId, votedForId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Vote failed');
    }
    return response.json();
};

export const revealRound = async (userId) => {
    const response = await fetch(`${API_URL}/reveal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reveal failed');
    }
    return response.json();
};

export const startTieBreaker = async (userId) => {
    const response = await fetch(`${API_URL}/tie-breaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start tie breaker');
    }
    return response.json();
};

export const nextRound = async (userId) => {
    const response = await fetch(`${API_URL}/next`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Next round failed');
    }
    return response.json();
};

export const prevRound = async (userId) => {
    const response = await fetch(`${API_URL}/prev`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Previous round failed');
    }
    return response.json();
};
