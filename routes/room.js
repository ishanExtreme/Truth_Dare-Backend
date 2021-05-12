const express = require('express');
require('dotenv').config();
const router = express.Router();
const Joi = require('joi');
const logger = require('../middleware/logger');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);


// Method: POST
// returns status 200 on successfull creation of room
// else return error
router.post('/create', async (req, res)=> {

    const {error} = validate(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    try{
        const room = await client.video.rooms.create({
            type: 'group-small',
            uniqueName: req.body.room,
            maxParticipants: 4,
            recordParticipantsOnConnect: false,
            mediaRegion: "in1",
        });
    }
    catch(err)
    {
        logger.error(err.message, err);
        return res.status(err.status).send({error:err.message});
    }

    res.status(200).send("Success");
});

// validate POST request body
const validate = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
}

module.exports = router;
