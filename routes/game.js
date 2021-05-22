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

    try {

        const {error} = validatePerformer(req.body);
        if(error) return res.status(400).send({error: error.details[0].message});

        const room = await client.video.rooms(req.body.room).fetch();

        const roomModel = await Room.findOne({sid: room.sid});
        if(!roomModel) return res.status(400).send({error:"Room not found in database"});

        roomModel.gameOn = true;
        await roomModel.save();

        let connectedParticipants = await client.video.rooms(req.body.room).participants.list({status: 'connected'})
        connectedParticipants = connectedParticipants.map((participant)=>participant.identity);

        if(connectedParticipants.length === 1) return res.status(400).send({error: "Find some friends to play with :)"});
        
        const randomParticipant = connectedParticipants[Math.floor(Math.random() * connectedParticipants.length)];

        res.send({participant: randomParticipant});
    }

    catch(err) {
        logger.error(err.message, err);
        return res.status(err.status).send({error:err.message});
    }
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
        if(!roomModel) return res.status(400).send({error:"Room not found in database"});
    
    // get the performer from database
    const participant = roomModel.participants.find(participant=>{
        return participant.name === req.body.identity;
    });

    // console.log(`1. ${participant}`);

    if(!participant) return res.status(400).send({error: "Unable to update score"});

    // get other participants
    const otherParticipants = roomModel.participants
                                    .filter((participant)=>participant.name !== req.body.identity);
    
    // console.log(`2. ${otherParticipants}`);

    // update performer score
    if(req.body.score === 1)
        participant.score = participant.score + 1;
    
    otherParticipants.push(participant);

    // console.log(`3. ${otherParticipants}`);

    roomModel.participants = otherParticipants;

    // console.log(`4. ${roomModel}`);

    await roomModel.save();

    res.status(200).send("success");
                            
});

router.post('/spin_over', async (req, res)=>{

    const {error} = validateSpinOver(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    const roomModel = await Room.findOne({sid: req.body.roomId});
        if(!roomModel) return res.status(400).send({error:"Room not found in database"});

    roomModel.gameOn = false;
    await roomModel.save();

    res.status(200).send("success");
});

router.post('/get_scores', async(req, res)=>{

    const {error} = validateGetScore(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    const roomModel = await Room.findOne({sid: req.body.roomId});

    let scoresDict = {};
    // makes a score dict for all the requested participants
    roomModel.participants.filter((participant)=>{
        return req.body.participants.includes(participant.name);
    }).map((participant)=>{
            scoresDict[participant.name] = participant.score;
    });

    // console.log(scoresDict);
    res.send({scores: scoresDict});
    // res.status(200).send("success");
});

// validate performer POST request body
const validatePerformer = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
};

// validate spin over POST request body
const validateSpinOver = (body)=>{
    const schema = Joi.object({
        roomId: Joi.string().required(),
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
        score: Joi.number().required()
    });

    return schema.validate(body);
};

// validate get score POST request body
const validateGetScore = (body)=>{
    const schema = Joi.object({
        participants: Joi.array().items(Joi.string()),
        roomId: Joi.string().required(),
    });

    return schema.validate(body);
}

module.exports = router;