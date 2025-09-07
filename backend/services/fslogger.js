
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

function formatLine(level, message) {
    const ts = new Date().toISOString();
    return `${ts} - ${level.toUpperCase()} - ${message}\n`;
}

function writeLog(message, level = 'info') {
    const line = formatLine(level, message);
    fs.appendFile(LOG_FILE, line, (err) => {
        if (err) {
            
            console.error('Error escribiendo log:', err.message);
        }
    });
}


const log = {
    debug: (msg) => writeLog(msg, 'debug'),
    info: (msg) => writeLog(msg, 'info'),
    warn: (msg) => writeLog(msg, 'warn'),
    error: (msg) => writeLog(msg, 'error'),
};

module.exports = { writeLog, log, LOG_FILE, LOG_DIR };
