const express = require('express');
const router = express.Router();
const { getStatus, getHistory } = require('../services/publicService');

router.get('/status', (req, res) => {
    getStatus()
        .then(payload => res.status(200).json(payload))
        .catch(err => {
            console.error('Error fetching status:', err);
            res.status(500).json({ error: 'Failed to fetch status' });
        });
});

router.get('/history', (req, res) => {
    getHistory()
        .then(payload => res.status(200).json(payload))
        .catch(err => {
            console.error('Error fetching history:', err);
            res.status(500).json({ error: 'Failed to fetch history' });
        });
});

module.exports = router;
