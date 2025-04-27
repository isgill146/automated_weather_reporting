# Automated Weather Reporting Service

This project is a fully automated backend service built using pure Node.js (no external libraries) that:
- Fetches weather data for the top 50 global cities from the AccuWeather API
- Generates a structured Google Sheet report
- Uploads the report to Google Drive
- Sends the shareable link via email to specified recipients
- Scheduled to run automatically on a weekly basis via a cron job

---

## Features

- **AccuWeather API Integration**: Fetches live weather conditions and metadata for the top 50 cities.
- **Data Transformation**: Cleans and formats fetched data into a user-friendly format.
- **Google Sheets Upload**: Uploads reports to a designated Google Drive folder as Google Sheets.
- **Email Notification**: Sends report links via Gmail SMTP to configured recipients.
- **Error Handling**: Graceful retries, logging, and proper failure reporting.
- **Pure Node.js Implementation**: No external libraries or frameworks used — native `https`, `fs`, `net`, `tls` modules.
- **Cron Automation**: Configured for seamless weekly execution.

---

## Tech Stack

| Technology | Purpose |
|:---|:---|
| Node.js v18+ | Backend runtime |
| HTTPS module | API requests |
| Google Drive API | Report uploads |
| Gmail SMTP | Email notifications |
| Cron (Linux/Mac) | Scheduled automation |

---

## 🧩 Project Structure

automated_weather_reporting/
├── helpers/
│   ├── logger.js
│   ├── utils.js
├── services/
│   ├── fetchCities.js
│   ├── fetchWeather.js
│   ├── generateCsv.js
│   ├── uploadDrive.js
│   ├── sendEmail.js
├── output/
│   └── (generated csv files)
├── .env
├── .env.example
├── cronlog.txt
├── package.json
├── README.md
├── index.js


## Environment Variables

Create a `.env` file in the project root.

You can refer to .env.example provided in the repo.

## How to Run Locally

- git clone <repo>
cd automated_weather_reporting

- Create a .env file and fill in your credentials.

- Run the project manually:
node index.js

It will:

1. Fetch city and weather data
2. Generate a Google Sheet
3. Upload to Drive
4. Send the email to recipients

## Cron job setup (every monday)

- Open your crontab
crontab -e

- Add following line
0 9 * * 1 cd /path/to/project && /path/to/node index.js >> cronlog.txt 2>&1

(eg cd /Users/ishangill/Desktop/code/personal/iion/automated_weather_reporting && /usr/local/bin/node index.js >> cronlog.txt 2>&1)