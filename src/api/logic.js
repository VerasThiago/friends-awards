const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

const readSettings = () => {
    try {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading settings:", err);
        return null;
    }
};

const writeSettings = (data) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing settings:", err);
        return false;
    }
};

module.exports = {
    getSettings: () => readSettings(),

    registerUser: (name, photo, ip) => {
        const settings = readSettings();
        if (!settings) throw new Error("Database error");

        if (settings.participants.find(p => p.ip === ip)) {
            throw new Error("User already registered");
        }

        let photoPath = null;
        if (photo) {
            try {
                // Expect photo to be base64 data URI
                const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const type = matches[1];
                    const data = Buffer.from(matches[2], 'base64');
                    const extension = type.split('/')[1];
                    const filename = `user-${Date.now()}.${extension}`;
                    const uploadPath = path.join(__dirname, 'uploads', filename);

                    fs.writeFileSync(uploadPath, data);
                    photoPath = `/uploads/${filename}`;
                }
            } catch (err) {
                console.error("Failed to save photo", err);
                // Continue without photo
            }
        }

        const newParticipant = {
            id: Date.now().toString(),
            name,
            ip,
            photo: photoPath,
            is_admin: false
        };

        settings.participants.push(newParticipant);
        writeSettings(settings);
        return newParticipant;
    },

    startService: (userId, action = null) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        if (settings.rounds.length > 0) {
            if (!action) {
                throw new Error("EXISTING_ROUNDS");
            }

            if (action === 'backup') {
                const backupFile = path.join(__dirname, `settings_backup_${Date.now()}.json`);
                fs.writeFileSync(backupFile, JSON.stringify(settings, null, 2));
            }

            if (action === 'backup' || action === 'overwrite') {
                settings.rounds = [];
                settings.service.active_round_id = null;
                settings.service.status = 'not_started';
            }
        }

        if (settings.categories.length === 0) {
            throw new Error("No categories to start voting");
        }

        // Initialize first round
        const firstCategory = settings.categories[0];
        const newRound = {
            id: Date.now().toString(),
            category_id: firstCategory.id,
            status: 'voting',
            votes: [],
            has_draw: false,
            tie_break_participants: [],
            tie_break_votes: [],
            result: null
        };

        settings.rounds.push(newRound);
        settings.service.status = 'started';
        settings.service.active_round_id = newRound.id;

        writeSettings(settings);
        return settings.service;
    },

    addCategory: (userId, name, description) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        const newCategory = {
            id: Date.now().toString(),
            name,
            description
        };
        settings.categories.push(newCategory);
        writeSettings(settings);
        return newCategory;
    },

    vote: (voterId, roundId, votedForId) => {
        const settings = readSettings();
        const round = settings.rounds.find(r => r.id === roundId);

        if (!round) throw new Error("Round not found");
        if (round.status !== 'voting' && round.status !== 'tie_breaker') {
            throw new Error("Voting is closed for this round");
        }

        // Prevent voting for self
        if (voterId === votedForId) {
            throw new Error("Cannot vote for yourself");
        }

        const voter = settings.participants.find(p => p.id === voterId);
        const votedFor = settings.participants.find(p => p.id === votedForId);

        if (voter && voter.is_admin) {
            throw new Error("Admins cannot vote");
        }

        if (votedFor && votedFor.is_admin) {
            throw new Error("Cannot vote for admin");
        }

        if (round.status === 'voting') {
            // Check if user already voted
            const existingVoteIndex = round.votes.findIndex(v => v.voterId === voterId);
            if (existingVoteIndex !== -1) {
                round.votes[existingVoteIndex].votedForId = votedForId;
            } else {
                round.votes.push({ voterId, votedForId });
            }
        } else if (round.status === 'tie_breaker') {
            // Check if votedForId is in tie_break_participants
            if (!round.tie_break_participants.includes(votedForId)) {
                throw new Error("Invalid vote for tie breaker");
            }

            const existingVoteIndex = round.tie_break_votes.findIndex(v => v.voterId === voterId);
            if (existingVoteIndex !== -1) {
                round.tie_break_votes[existingVoteIndex].votedForId = votedForId;
            } else {
                round.tie_break_votes.push({ voterId, votedForId });
            }
        }

        writeSettings(settings);
        return true;
    },

    revealRound: (userId) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        const round = settings.rounds.find(r => r.id === settings.service.active_round_id);
        if (!round) throw new Error("No active round");

        const votesToCount = round.status === 'tie_breaker' ? round.tie_break_votes : round.votes;

        // Calculate stats
        const stats = {};
        votesToCount.forEach(v => {
            stats[v.votedForId] = (stats[v.votedForId] || 0) + 1;
        });

        // Find max votes
        let maxVotes = 0;
        Object.values(stats).forEach(count => {
            if (count > maxVotes) maxVotes = count;
        });

        // Find winners (ids with maxVotes)
        const winners = Object.keys(stats).filter(id => stats[id] === maxVotes);

        if (winners.length > 1) {
            // Tie Breaker
            round.has_draw = true;
            round.status = 'revealing'; // Show animation first
            round.tie_break_participants = winners;
            round.result = {
                winnerId: 'draw',
                stats
            };
        } else {
            // Winner found
            round.status = 'revealing'; // Frontend will play animation then show result
            round.result = {
                winnerId: winners[0],
                stats
            };
        }

        writeSettings(settings);
        return round;
    },

    startTieBreaker: (userId) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        const round = settings.rounds.find(r => r.id === settings.service.active_round_id);
        if (!round) throw new Error("No active round");

        if (!round.has_draw) {
            throw new Error("No draw detected");
        }

        round.status = 'tie_breaker';
        round.tie_break_votes = []; // Reset for new voting

        writeSettings(settings);
        return round;
    },

    nextRound: (userId) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        const currentRound = settings.rounds.find(r => r.id === settings.service.active_round_id);
        if (currentRound) {
            currentRound.status = 'completed';
        }

        // Find next category
        const currentCategoryIndex = settings.categories.findIndex(c => c.id === currentRound.category_id);
        if (currentCategoryIndex === -1 || currentCategoryIndex === settings.categories.length - 1) {
            // Finished
            settings.service.status = 'finished';
            settings.service.active_round_id = null;
        } else {
            // Next category
            const nextCategory = settings.categories[currentCategoryIndex + 1];

            // Check if round already exists for this category
            const existingRound = settings.rounds.find(r => r.category_id === nextCategory.id);

            if (existingRound) {
                settings.service.active_round_id = existingRound.id;
                // If we are reusing a round, we might want to ensure it's not in a weird state?
                // For now, assume we just go back to whatever state it was (likely completed or voting if we went back then forward)
            } else {
                const newRound = {
                    id: Date.now().toString(),
                    category_id: nextCategory.id,
                    status: 'voting',
                    votes: [],
                    has_draw: false,
                    tie_break_participants: [],
                    tie_break_votes: [],
                    result: null
                };
                settings.rounds.push(newRound);
                settings.service.active_round_id = newRound.id;
            }
        }

        writeSettings(settings);
        return settings.service;
    },

    prevRound: (userId) => {
        const settings = readSettings();
        const participant = settings.participants.find(p => p.id === userId);
        if (!participant || !participant.is_admin) {
            throw new Error("Unauthorized");
        }

        const currentRound = settings.rounds.find(r => r.id === settings.service.active_round_id);
        let currentCategoryIndex = -1;

        if (currentRound) {
            currentCategoryIndex = settings.categories.findIndex(c => c.id === currentRound.category_id);
        } else if (settings.service.status === 'finished') {
            // If finished, we are effectively after the last category
            currentCategoryIndex = settings.categories.length;
        }

        if (currentCategoryIndex <= 0) {
            throw new Error("No previous category");
        }

        // Previous category
        const prevCategory = settings.categories[currentCategoryIndex - 1];
        const prevRound = settings.rounds.find(r => r.category_id === prevCategory.id);

        if (!prevRound) {
            throw new Error("Previous round not found");
        }

        // Force status to completed so we see results
        prevRound.status = 'completed';

        settings.service.active_round_id = prevRound.id;
        settings.service.status = 'started'; // Ensure service is started if we came back from finished

        writeSettings(settings);
        return settings.service;
    }
};
