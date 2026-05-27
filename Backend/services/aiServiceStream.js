const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://127.0.0.1:11434'
});

const OLLAMA_TIMEOUT = 30000;

function createTimeoutPromise(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Ollama request timeout after ${ms}ms`)), ms)
    );
}

async function analyzeAirPollutionStream(weatherData, airData, res) {
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

        console.log("Streaming prompt to Ollama...");

        // Create promise race between actual request and timeout
        const streamPromise = ollama.chat({
            model: 'phi3',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false // We'll handle streaming manually by sending chunks
        });

        // Create timeout wrapper
        const response = await Promise.race([
            streamPromise,
            createTimeoutPromise(OLLAMA_TIMEOUT)
        ]);

        console.log("Ollama Response Received - Streaming to client");

        const fullText = response.message.content;
        
        // Stream the response character by character with small delays
        // This creates a typewriter effect
        const chunkSize = 5; // Send 5 characters at a time
        const delayMs = 10; // 10ms between chunks for smooth animation

        for (let i = 0; i < fullText.length; i += chunkSize) {
            const chunk = fullText.slice(i, i + chunkSize);
            
            // Send chunk as Server-Sent Event
            res.write(`data: ${JSON.stringify({
                type: 'chunk',
                text: chunk
            })}\n\n`);

            // Small delay between chunks for animation effect
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        console.log("Streaming complete");

    } catch (error) {
        console.log("OLLAMA STREAM ERROR:", error.message);

        // Send fallback analysis as streaming chunks
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

        // Stream fallback response character by character
        const chunkSize = 5;
        const delayMs = 10;

        for (let i = 0; i < fallbackAnalysis.length; i += chunkSize) {
            const chunk = fallbackAnalysis.slice(i, i + chunkSize);
            
            res.write(`data: ${JSON.stringify({
                type: 'chunk',
                text: chunk
            })}\n\n`);

            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

module.exports = analyzeAirPollutionStream;
