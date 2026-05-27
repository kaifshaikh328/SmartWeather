const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

// Set timeout for Ollama requests (30 seconds)
const OLLAMA_TIMEOUT = 30000;

function createTimeoutPromise(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Ollama request timeout after ${ms}ms`)), ms)
    );
}

async function analyzeAirPollution(weatherData, airData) {
    try {
        const prompt = `You are an air quality analyst. Analyze today's environmental conditions and provide brief, actionable insights.

City: ${weatherData.city}
Temperature: ${weatherData.temperature}°C
Humidity: ${weatherData.humidity}%
Weather: ${weatherData.weather_description}

Air Quality Index (AQI): ${airData.air_quality_index} (${airData.air_quality})
Health Advice: ${airData.health_advice}

Key Pollutants:
- PM2.5: ${airData.pollutants.pm2_5} µg/m³
- PM10: ${airData.pollutants.pm10} µg/m³
- NO2: ${airData.pollutants.no2} ppb
- O3: ${airData.pollutants.o3} ppb

Provide:
1. Brief air quality analysis (2 sentences)
2. Health recommendations (2 sentences)
3. Outdoor activity suggestion (1 sentence)

Keep response concise and practical.`;

        console.log("Sending prompt to Ollama...");

        // Create promise race between actual request and timeout
        const responsePromise = ollama.chat({
            model: 'phi3',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const response = await Promise.race([
            responsePromise,
            createTimeoutPromise(OLLAMA_TIMEOUT)
        ]);

        console.log("Ollama Response Received");
        return response.message.content;

    } catch (error) {
        console.log("OLLAMA ERROR:", error.message);

        // Return fallback analysis based on available data
        const fallbackAnalysis = `
Air Quality Report for ${weatherData.city}:

Air Quality Status: ${airData.air_quality} (AQI: ${airData.air_quality_index})
Health Advice: ${airData.health_advice}

Temperature: ${weatherData.temperature}°C with ${weatherData.humidity}% humidity.

Primary Pollutant Levels:
- PM2.5: ${airData.pollutants.pm2_5} µg/m³
- PM10: ${airData.pollutants.pm10} µg/m³

Weather Condition: ${weatherData.weather_description}

Note: AI analysis service is temporarily unavailable. Showing real-time data analysis.`;

        return fallbackAnalysis;
    }
}

module.exports = analyzeAirPollution;