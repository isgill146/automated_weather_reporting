const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envData = fs.readFileSync(envPath, 'utf8');
  envData.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const { fetchTopCities } = require('./services/fetchCities.js');
const { fetchWeatherDataForCities } = require('./services/fetchWeather.js');
const { generateCsvReport } = require('./services/generateCsv.js');
const { uploadFileToDrive } = require('./services/uploadDrive.js');
const { sendReportEmail } = require('./services/sendEmail.js');
const { logInfo, logError } = require('./helpers/loggers.js');


async function main() {
  try {
    logInfo('weather reporting service started...');

    // Fetch top 50 cities
    const cities = await fetchTopCities();
    logInfo(`fetch ${cities.length} top cities.`);

    // Fetch current weather for each city
    const weatherData = await fetchWeatherDataForCities(cities);
    logInfo(`fetched current weather data for ${weatherData.length} cities.`);

    // Generate CSV report
    const csvFilePath = await generateCsvReport(weatherData);
    logInfo(`generated CSV report at ${csvFilePath}.`);

    // Upload CSV file to Google Drive
    const drivePublicLink = await uploadFileToDrive(csvFilePath);
    logInfo(`Uploaded file to Google Drive. Public link: ${drivePublicLink}`);

    // Send Email with report link
    await sendReportEmail(drivePublicLink);
    logInfo('Email sent successfully.');

    logInfo('Weather reporting service finished successfully.');

  } catch (error) {
    logError(error.message || error);
  }
}

main();
