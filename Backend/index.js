const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '45000'); // 45 seconds

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    req.setTimeout(REQUEST_TIMEOUT);
    res.setTimeout(REQUEST_TIMEOUT);
    next();
});

// Middleware
const weatherMiddleware = require('./middleware/weatherMiddleware');

// AI Service
const analyzeAirPollution = require('./services/aiService');
const analyzeAirPollutionStream = require('./services/aiServiceStream');

// Standard API endpoint
app.get('/api/weather', weatherMiddleware, async (req, res) => {

    try {

        const weather = req.weatherData;
        const air = req.airData;

        // AI Analysis (with timeout handling)
        let aiAnalysis = '';
        try {
            aiAnalysis = await analyzeAirPollution(weather, air);
        } catch (aiError) {
            console.log("AI Service Error - using fallback:", aiError.message);
            aiAnalysis = `Air Quality: ${air.air_quality} (${air.health_advice})`;
        }

        res.json({

            success: true,

            weather: weather,

            air_quality: air,

            ai_analysis: aiAnalysis

        });

    } catch (error) {

        console.log(error.message);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});

// Streaming endpoint for real-time AI analysis
app.get('/api/weather/stream', weatherMiddleware, async (req, res) => {
    try {
        const weather = req.weatherData;
        const air = req.airData;

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Send initial data
        res.write(`data: ${JSON.stringify({
            type: 'metadata',
            weather: weather,
            air_quality: air
        })}\n\n`);

        // Stream AI analysis
        await analyzeAirPollutionStream(weather, air, res);

        // Send completion signal
        res.write(`data: ${JSON.stringify({
            type: 'complete'
        })}\n\n`);

        res.end();

    } catch (error) {
        console.log("Stream Error:", error.message);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: error.message
        })}\n\n`);
        res.end();
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}/api/weather?city=YourCity`);
    console.log(`Streaming endpoint: http://localhost:${PORT}/api/weather/stream?city=YourCity`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);

});