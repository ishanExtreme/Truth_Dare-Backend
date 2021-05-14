const winston = require('winston');
require('dotenv').config();
const logdnaWinston = require('logdna-winston');

const logger = winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
  });

//   logging to console for development enviroment
if(process.env.NODE_ENV!=='prod')
{
    logger.add(new winston.transports.Console({
        format: winston.format.colorize(),
    }));

    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    logger.add(new winston.transports.File
        ({ filename: 'error.log', level: 'error' }));
    
    logger.add(new winston.transports.File
        ({ filename: 'combined.log' }));

}

// logdna options
const options = {
    hostname:'WebApp',
    app: 'Truth-Dare',
    indexMeta: true,
    level:'error',
    key: process.env.LOG_KEY,
}
options.handleExceptions = true;

// logging to logdna for production enviroment
if(process.env.NODE_ENV==='prod')
    logger.add(new logdnaWinston(options));



module.exports = logger;