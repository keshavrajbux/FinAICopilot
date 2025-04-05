/**
 * logger.js
 * Centralized logging utility
 */
const winston = require('winston');

/**
 * Create a logger instance with the specified context name
 * @param {string} context - The context name for the logger
 * @returns {winston.Logger} - Configured logger instance
 */
function createLogger(context) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
      winston.format.printf(info => {
        const metadata = info.metadata && Object.keys(info.metadata).length ? 
          ` ${JSON.stringify(info.metadata)}` : '';
        return `${info.timestamp} ${info.level}: [${context}] ${info.message}${metadata}`;
      })
    ),
    defaultMeta: { context },
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
}

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  winston.loggers.add('console', {
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
}

module.exports = {
  createLogger
}; 