const https = require('https');

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP Status ${res.statusCode}`));
        }
        resolve(data);
      });

      res.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};


const setFilePublic = (fileId, accessToken) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      role: 'reader',
      type: 'anyone'
    });

    const options = {
      hostname: 'www.googleapis.com',
      path: `/drive/v3/files/${fileId}/permissions`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve();
        } else {
          reject(new Error(`Failed to set file public: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
};

module.exports = {
  sleep,
  httpsGet,
  setFilePublic,
};
