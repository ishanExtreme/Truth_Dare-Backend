const express = require('express');
const router = express.Router();
const Joi = require('joi');
require('dotenv').config();
const logger = require('../middleware/logger');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const {Room} = require('../models/room');

// gives the person going to perform the task randomly
router.post('/performer' , async (req, res)=>{

    const {error} = validatePerformer(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    let connectedParticipants = await client.video.rooms(req.body.room).participants.list({status: 'connected'})
    
    connectedParticipants = connectedParticipants.map((participant)=>participant.identity);

    const randomParticipant = connectedParticipants[Math.floor(Math.random() * connectedParticipants.length)];

    res.send({participant: randomParticipant});
});

// validate performer POST request body
const validatePerformer = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
}

module.exports = router;