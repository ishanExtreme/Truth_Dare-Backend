const logger = require('./logger');

module.exports = (err, req, res, next)=>{
    // Log Exception
    logger.error(err.message, err);

    return res.status(500).send({error:"Something Failed, Try again later"}); 
}