const axios = require('axios');

const weatherMiddleware = async (req, res, next) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Missing OpenWeather API key. Set WEATHER_API_KEY in your environment.',
      });
    }

    const city = String(req.query.city || 'Pune').trim() || 'Pune';
    const encodedCity = encodeURIComponent(city);

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric`;
    const weatherResponse = await axios.get(weatherUrl, { timeout: 30000 });

    const weatherData = weatherResponse.data;
    if (!weatherData || !weatherData.coord || !Array.isArray(weatherData.weather) || weatherData.weather.length === 0) {
      throw new Error('Invalid weather response from OpenWeather');
    }

    const lat = weatherData.coord.lat;
    const lon = weatherData.coord.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Unable to determine latitude/longitude from weather data');
    }

    const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const airResponse = await axios.get(airUrl, { timeout: 30000 });

    const airData = airResponse.data;
    const airListItem = Array.isArray(airData.list) ? airData.list[0] : null;
    if (!airListItem || !airListItem.main || !airListItem.components) {
      throw new Error('Invalid air pollution response from OpenWeather');
    }

    const aqi = Number(airListItem.main.aqi);

    const getAqiAdvice = (value) => {
      switch (value) {
        case 1:
          return { airQuality: 'Good', healthAdvice: 'Air is clean and safe.' };
        case 2:
          return { airQuality: 'Fair', healthAdvice: 'Air quality is acceptable.' };
        case 3:
          return { airQuality: 'Moderate', healthAdvice: 'Sensitive people should reduce outdoor exposure.' };
        case 4:
          return { airQuality: 'Poor', healthAdvice: 'Avoid long outdoor activities.' };
        case 5:
          return { airQuality: 'Very Poor', healthAdvice: 'Wear a mask and stay indoors if possible.' };
        default:
          return { airQuality: 'Unknown', healthAdvice: 'No health advice available.' };
      }
    };

    const { airQuality, healthAdvice } = getAqiAdvice(aqi);
    const weatherItem = weatherData.weather[0] || {};
    const components = airListItem.components || {};

    req.weatherData = {
      city: weatherData.name || city,
      country: weatherData.sys?.country || 'Unknown',
      temperature: weatherData.main?.temp,
      feels_like: weatherData.main?.feels_like,
      humidity: weatherData.main?.humidity,
      pressure: weatherData.main?.pressure,
      wind_speed: weatherData.wind?.speed,
      weather_condition: weatherItem.main || weatherData.weather[0]?.main || 'Unknown',
      weather_description: weatherItem.description || weatherData.weather[0]?.description || 'No description',
      icon: weatherItem.icon || '01d',
      sunrise: weatherData.sys?.sunrise,
      sunset: weatherData.sys?.sunset,
    };

    req.airData = {
      air_quality_index: Number.isNaN(aqi) ? null : aqi,
      air_quality: airQuality,
      health_advice: healthAdvice,
      pollutants: {
        co: components.co,
        no: components.no,
        no2: components.no2,
        o3: components.o3,
        so2: components.so2,
        pm2_5: components.pm2_5,
        pm10: components.pm10,
        nh3: components.nh3,
      },
    };

    return next();
  } catch (error) {
    console.error('Weather Middleware Error:', error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: `City not found: ${req.query.city}`,
        error: error.response.data?.message || 'City lookup failed',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather and air quality data',
      error: error.message,
    });
  }
};

module.exports = weatherMiddleware;