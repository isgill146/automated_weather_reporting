const net = require('net');
const tls = require('tls');
const { logInfo, logError } = require('../helpers/loggers');

const SMTP_SERVER = process.env.EMAIL_SMTP_SERVER;
const SMTP_PORT = parseInt(process.env.EMAIL_SMTP_PORT, 10);
const EMAIL_SENDER = process.env.EMAIL_SENDER_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_SENDER_PASSWORD;
const EMAIL_RECEIVERS = process.env.EMAIL_RECEIVER_ADDRESSES.split(',');

const sendCommand = (socket, command) => {
  return new Promise((resolve) => {
    socket.write(command + '\r\n');
    socket.once('data', (data) => {
      resolve(data.toString());
    });
  });
};

const sendReportEmail = async (publicLink) => {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(SMTP_PORT, SMTP_SERVER, async () => {
      try {
        await readResponse(socket);
        await sendCommand(socket, `EHLO ${SMTP_SERVER}`);
        const startTlsResponse = await sendCommand(socket, 'STARTTLS');

        if (!startTlsResponse.startsWith('220')) {
          throw new Error('STARTTLS failed');
        }

        // Upgrade socket to TLS
        const secureSocket = tls.connect({
          socket: socket,
          servername: SMTP_SERVER,
          rejectUnauthorized: false,
        }, async () => {
          try {
            await sendCommand(secureSocket, `EHLO ${SMTP_SERVER}`);

            await sendCommand(secureSocket, 'AUTH LOGIN');
            await sendCommand(secureSocket, Buffer.from(EMAIL_SENDER).toString('base64'));
            await sendCommand(secureSocket, Buffer.from(EMAIL_PASSWORD).toString('base64'));

            await sendCommand(secureSocket, `MAIL FROM:<${EMAIL_SENDER}>`);
            for (const receiver of EMAIL_RECEIVERS) {
              await sendCommand(secureSocket, `RCPT TO:<${receiver.trim()}>`);
            }

            await sendCommand(secureSocket, 'DATA');

            const subject = `Ishan's Assignment - Weekly Weather Report`;
            const body = `Hello,\n\nHere is the latest weekly weather report link:\n${publicLink}\n\nRegards,\nWeather Reporting Service`;

            const message = 
              `Subject: ${subject}\r\n` +
              `From: ${EMAIL_SENDER}\r\n` +
              `To: ${EMAIL_RECEIVERS.join(', ')}\r\n` +
              `\r\n` +
              `${body}\r\n.`;

            await sendCommand(secureSocket, message);
            await sendCommand(secureSocket, 'QUIT');

            secureSocket.end();
            logInfo('Email sent successfully.');
            resolve();
          } catch (error) {
            logError(`Failed inside secure connection: ${error.message || error}`);
            secureSocket.end();
            reject(error);
          }
        });

        secureSocket.on('error', (err) => {
          logError(`TLS connection error: ${err.message}`);
          reject(err);
        });
      } catch (error) {
        logError(`SMTP plain connection failed: ${error.message || error}`);
        socket.end();
        reject(error);
      }
    });

    socket.on('error', (err) => {
      logError(`SMTP TCP error: ${err.message}`);
      reject(err);
    });
  });
};

const readResponse = (socket) => {
  return new Promise((resolve) => {
    socket.once('data', (data) => {
      resolve(data.toString());
    });
  });
};

module.exports = {
  sendReportEmail,
};
