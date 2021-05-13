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

    if(connectedParticipants.length === 1) return res.status(400).send({error: "Find some friends to play with :)"});
    
    const randomParticipant = connectedParticipants[Math.floor(Math.random() * connectedParticipants.length)];

    res.send({participant: randomParticipant});
});

// excluding person performing the task gives the task judge
router.post('/task_giver', async (req, res)=>{

    const {error} = validateTaskGiver(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    let connectedParticipants = await client.video.rooms(req.body.room).participants.list({status: 'connected'});
    // all connected participants except the one performing task
    connectedParticipants = connectedParticipants.map((participant)=>participant.identity)
                                                .filter((participant)=> participant!==req.body.identity);

    // no other participant connected at this time  
    if(connectedParticipants.length === 0) return res.status(400).send({error: "No other participant found"});

    const randomParticipant = connectedParticipants[Math.floor(Math.random() * connectedParticipants.length)];
    res.send({participant: randomParticipant});

});

router.post('/score_update', async (req, res)=>{

    const {error} = validateScoreUpdated(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    // get room model from database
    const roomModel = await Room.findOne({sid: req.body.roomId});

    // get the performer from database
    const participant = roomModel.participants.find(participant=>{
        return participant.name === req.body.identity;
    });

    if(!participant) return res.status(400).send({error: "Unable to update score"});

    // get other participants
    const otherParticipants = roomModel.participants
                                    .filter((participant)=>participant.name !== req.body.identity);
    
    // update performer score
    if(req.body.score === 1)
        participant.score +=1;
    
    otherParticipants.push(participant);

    roomModel.participants = otherParticipants;

    await roomModel.save();

    res.status(200).send("success");
                            
})

// validate performer POST request body
const validatePerformer = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
};

// validate tasker giver POST request body
const validateTaskGiver = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
        identity: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
};

// validate score update POST request body
const validateScoreUpdated = (body)=>{
    const schema = Joi.object({
        roomId: Joi.string().required(),
        identity: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
};

module.exports = router;