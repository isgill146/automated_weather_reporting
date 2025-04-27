const { logInfo, logError } = require('../helpers/loggers');
const { sleep, httpsGet } = require('../helpers/utils');

const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;
const TOP_CITIES_LIMIT = 50;

const fetchTopCities = async (retries = 3) => {
  const url = `https://dataservice.accuweather.com/locations/v1/topcities/${TOP_CITIES_LIMIT}?apikey=${ACCUWEATHER_API_KEY}`;

  try {
    const response = await httpsGet(url);
    const parsed = JSON.parse(response);

    const cleanedCities = parsed.map((city) => ({
      locationKey: city.Key,
      name: city.EnglishName,
      country: city.Country?.EnglishName || '',
      region: city.Region?.EnglishName || '',
      timezone: city.TimeZone?.Name || '',
      rank: city.Rank,
      latitude: city.GeoPosition?.Latitude,
      longitude: city.GeoPosition?.Longitude,
    }));

    return cleanedCities;

  } catch (err) {
    if (retries > 0) {
      logError(`Failed to fetch cities. Retrying... (${retries} retries left)`);
      await sleep(2000);
      return fetchTopCities(retries - 1);
    } else {
      throw new Error(`Failed to fetch cities after retries: ${err.message || err}`);
    }
  }
};

module.exports = {
  fetchTopCities,
};
