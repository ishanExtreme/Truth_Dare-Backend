const logger = require('../middleware/logger');


module.exports = function () {

    // for unhandled error in node
    process.on('uncaughtException', (ex)=>{
        logger.error(ex.message, ex,()=>{
            process.exit(1);
        });
       
    })

    // for unhandled promise rejection in node
    process.on('unhandledRejection', (ex)=>{
        logger.error(ex.message, ex,()=>{
            process.exit(1);
        });
    })
    
}