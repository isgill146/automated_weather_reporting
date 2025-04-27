const https = require('https');
const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../helpers/loggers');
const { sleep, setFilePublic } = require('../helpers/utils');
const crypto = require('crypto');

const GCP_CLIENT_EMAIL = process.env.GCP_CLIENT_EMAIL;
const GCP_PRIVATE_KEY = process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n');

const generateAccessToken = () => {
  return new Promise((resolve, reject) => {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1 hour exp
    const payload = {
      iss: GCP_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureBase = `${base64Header}.${base64Payload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureBase);
    const signature = sign.sign(GCP_PRIVATE_KEY, 'base64url');

    const jwt = `${signatureBase}.${signature}`;

    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(body);
          resolve(parsed.access_token);
        } else {
          reject(`Failed to get access token: ${res.statusCode} - ${body}`);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(params.toString());
    req.end();
  });
};

const uploadFileToDrive = async (filePath) => {
  try {
    const accessToken = await generateAccessToken();
    const fileContent = fs.readFileSync(filePath);

    const today = new Date();
    const readableDate = today.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
    const fileName = `Weekly Weather Report - ${readableDate}.csv`;

    const boundary = 'boundary123456789';
    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [process.env.GCP_DRIVE_FOLDER_ID]
    };

    const multipartRequestBody =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      `--${boundary}\r\n` +
      'Content-Type: text/csv\r\n\r\n' +
      fileContent + '\r\n' +
      `--${boundary}--`;

    const options = {
      hostname: 'www.googleapis.com',
      path: '/upload/drive/v3/files?uploadType=multipart',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(multipartRequestBody)
      }
    };

    const fileId = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(body);
            resolve(parsed.id);
          } else {
            reject(`File upload failed: ${res.statusCode} - ${body}`);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(multipartRequestBody);
      req.end();
    });

    // make the file public readable
    await setFilePublic(fileId, accessToken);

    const publicLink = `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=sharing`;
    logInfo(`File uploaded successfully. Public Link: ${publicLink}`);

    return publicLink;

  } catch (error) {
    logError(`Failed to upload file to Google Drive: ${error.message || error}`);
    throw error;
  }
};


module.exports = {
  uploadFileToDrive,
};
