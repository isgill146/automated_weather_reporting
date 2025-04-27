const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../helpers/loggers');

const generateCsvReport = async (data) => {
  try {
    const headers = [
      'Name', 
      'Country', 
      'Region', 
      'Timezone', 
      'Rank', 
      'Latitude', 
      'Longitude', 
      'Weather Text', 
      'Is Day Time', 
      'Temperature Celsius', 
      'Temperature Fahrenheit',
      'Last Updated At'
    ];

    const csvRows = [];

    // Add header row
    csvRows.push(headers.map(quote).join(','));

    // Add each data row
    for (const item of data) {
      const row = [
        item.name,
        item.country,
        item.region,
        item.timezone,
        item.rank,
        item.latitude,
        item.longitude,
        item.weatherText,
        item.isDayTime,
        item.temperatureCelsius,
        item.temperatureFahrenheit,
        item.lastUpdatedAt,
      ].map(quote).join(',');

      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');

    // write file
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, `weather_report_${Date.now()}.csv`);

    await fs.promises.writeFile(filePath, csvContent, 'utf8');
    logInfo(`CSV file successfully written at ${filePath}`);

    return filePath;

  } catch (error) {
    logError(`Failed to generate CSV: ${error.message || error}`);
    throw error;
  }
};

const quote = (value) => {
    // escape quotes
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
};

module.exports = {
  generateCsvReport,
};
