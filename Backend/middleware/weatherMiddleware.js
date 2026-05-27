const axios = require('axios');

const weatherMiddleware = async (req, res, next) => {

    try {

        // Get city from query
        const city = req.query.city || "Pune";

        // ==============================
        // WEATHER API
        // ==============================

        const weatherResponse = await axios.get(

            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`

        );

        const weatherData = weatherResponse.data;

        // ==============================
        // GET LATITUDE & LONGITUDE
        // ==============================

        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;

        // ==============================
        // AIR POLLUTION API
        // ==============================

        const airResponse = await axios.get(

            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`

        );

        const airData = airResponse.data;

        // ==============================
        // AQI ANALYSIS
        // ==============================

        const aqi = airData.list[0].main.aqi;

        let airQuality = "";
        let healthAdvice = "";

        switch (aqi) {

            case 1:
                airQuality = "Good";
                healthAdvice = "Air is clean and safe.";
                break;

            case 2:
                airQuality = "Fair";
                healthAdvice = "Air quality is acceptable.";
                break;

            case 3:
                airQuality = "Moderate";
                healthAdvice = "Sensitive people should reduce outdoor exposure.";
                break;

            case 4:
                airQuality = "Poor";
                healthAdvice = "Avoid long outdoor activities.";
                break;

            case 5:
                airQuality = "Very Poor";
                healthAdvice = "Wear a mask and stay indoors if possible.";
                break;

            default:
                airQuality = "Unknown";
                healthAdvice = "No health advice available.";
        }

        // ==============================
        // STORE DATA IN REQUEST
        // ==============================

        req.weatherData = {

            city: weatherData.name,

            country: weatherData.sys.country,

            temperature: weatherData.main.temp,

            feels_like: weatherData.main.feels_like,

            humidity: weatherData.main.humidity,

            pressure: weatherData.main.pressure,

            wind_speed: weatherData.wind.speed,

            weather_condition: weatherData.weather[0].main,

            weather_description: weatherData.weather[0].description,

            icon: weatherData.weather[0].icon,

            sunrise: weatherData.sys.sunrise,

            sunset: weatherData.sys.sunset

        };

        req.airData = {

            air_quality_index: aqi,

            air_quality: airQuality,

            health_advice: healthAdvice,

            pollutants: {

                co: airData.list[0].components.co,

                no: airData.list[0].components.no,

                no2: airData.list[0].components.no2,

                o3: airData.list[0].components.o3,

                so2: airData.list[0].components.so2,

                pm2_5: airData.list[0].components.pm2_5,

                pm10: airData.list[0].components.pm10,

                nh3: airData.list[0].components.nh3

            }

        };

        // Continue to next middleware
        next();

    } catch (error) {

        console.log("Weather Middleware Error:", error.message);

        res.status(500).json({

            success: false,

            message: "Failed to fetch weather and air quality data",

            error: error.message

        });

    }

};

module.exports = weatherMiddleware;