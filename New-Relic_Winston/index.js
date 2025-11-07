require('newrelic');
const logger = require('./logger');
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    logger.info('Ping received', { route: '/ping' });
    res.json({ message: 'pong' });
});

app.get('/slow', async (req, res) => {
    logger.warn('Slow endpoint triggered');
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.json({ status: 'ok' });
});

app.get('/error', (req, res) => {
    logger.error('Unexpected error occurred');
    throw new Error('Boom!');
});

app.listen(3000, () => logger.info('Server started on port 3000'));