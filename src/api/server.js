const express = require('express');
const os = require('os');
const cors = require('cors'); // Keep cors for dev if needed, but mostly not needed for monolith
const bodyParser = require('body-parser');
const path = require('path');
const logic = require('./logic');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for images

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Endpoints
app.get('/api/status', (req, res) => {
    const settings = logic.getSettings();
    if (!settings) return res.status(500).json({ error: "Failed to load settings" });

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';

    const participant = settings.participants.find(p => p.ip === ip);

    const activeRound = settings.rounds.find(r => r.id === settings.service.active_round_id);

    res.json({
        service: settings.service,
        activeRound: activeRound || null,
        participants: settings.participants,
        user: participant || null,
        ip
    });
});

app.get('/api/results', (req, res) => {
    const settings = logic.getSettings();
    if (!settings) return res.status(500).json({ error: "Failed to load settings" });

    res.json({
        categories: settings.categories,
        rounds: settings.rounds,
        participants: settings.participants
    });
});

app.post('/api/register', (req, res) => {
    const { name, photo } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';

    try {
        const user = logic.registerUser(name, photo, ip);
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/start', (req, res) => {
    const { userId, action } = req.body;
    try {
        const service = logic.startService(userId, action);
        res.json({ success: true, service });
    } catch (err) {
        if (err.message === 'EXISTING_ROUNDS') {
            return res.status(409).json({ error: "Existing rounds found", code: 'EXISTING_ROUNDS' });
        }
        res.status(403).json({ error: err.message });
    }
});

app.get('/api/categories', (req, res) => {
    const settings = logic.getSettings();
    res.json(settings.categories);
});

app.post('/api/categories', (req, res) => {
    const { userId, name, description } = req.body;
    try {
        const category = logic.addCategory(userId, name, description);
        res.json(category);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

app.post('/api/vote', (req, res) => {
    const { voterId, roundId, votedForId } = req.body;
    try {
        logic.vote(voterId, roundId, votedForId);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/reveal', (req, res) => {
    const { userId } = req.body;
    try {
        const round = logic.revealRound(userId);
        res.json(round);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/tie-breaker', (req, res) => {
    const { userId } = req.body;
    try {
        const round = logic.startTieBreaker(userId);
        res.json(round);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/next', (req, res) => {
    const { userId } = req.body;
    try {
        const service = logic.nextRound(userId);
        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/prev', (req, res) => {
    const { userId } = req.body;
    try {
        const service = logic.prevRound(userId);
        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIpAddress();
    console.log(`Server running on:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${ip}:${PORT}`);
});
