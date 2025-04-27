const { logInfo, logError } = require('../helpers/loggers');
const { sleep, httpsGet } = require('../helpers/utils');

const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;

const fetchWeatherDataForCities = async (cities) => {
  const finalData = [];

  for (const city of cities) {
    try {
      const weatherData = await fetchWeatherForCity(city.locationKey);
      finalData.push({
        ...city,
        weatherText: weatherData.weatherText,
        isDayTime: weatherData.isDayTime,
        temperatureCelsius: weatherData.temperatureCelsius,
        temperatureFahrenheit: weatherData.temperatureFahrenheit,
        lastUpdatedAt: weatherData.lastUpdatedAt,
      });
    } catch (error) {
      logError(`Failed to fetch weather for city: ${city.name}. Error: ${error}`);
    }
  }

  return finalData;
};

const fetchWeatherForCity = async (locationKey, retries = 3) => {
  const url = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}`;

  try {
    const response = await httpsGet(url);
    const parsed = JSON.parse(response);
    const weather = parsed[0];

    return {
      weatherText: weather.WeatherText || '',
      isDayTime: weather.IsDayTime || false,
      temperatureCelsius: weather.Temperature?.Metric?.Value || null,
      temperatureFahrenheit: weather.Temperature?.Imperial?.Value || null,
      lastUpdatedAt: weather.LocalObservationDateTime || null
    };

  } catch (err) {
    if (retries > 0) {
      logError(`Retrying weather fetch for locationKey ${locationKey} (${retries} retries left)`);
      await sleep(2000);
      return fetchWeatherForCity(locationKey, retries - 1);
    } else {
      throw new Error(`Failed to fetch weather for ${locationKey}: ${err.message || err}`);
    }
  }
};

module.exports = {
  fetchWeatherDataForCities,
};
