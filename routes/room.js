const express = require('express');
require('dotenv').config();
const router = express.Router();
const Joi = require('joi');
const logger = require('../middleware/logger');
const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const {Room} = require('../models/room');

// Method: POST
// Flow: Find room from twilio cloud->find room model in database
// if found->check if participant connected in room
// if connected->send error, else send score
// if room model not found in database-> send 0 score
router.post('/join', async (req, res)=> {

    const {error} = validateJoin(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    try {

        // Get room from twilio cloud
        const room = await client.video.rooms(req.body.room).fetch();
        
        // Get room model from database
        const roomModel = await Room.findOne({sid: room.sid});
        if(!roomModel) return res.status(400).send({error:"Room not found in database"});

        // if game is on during joining
        if(roomModel.gameOn) 
        {
            const connectedParticipants = await client.video.rooms(req.body.room).participants.list({status: 'connected'});
            if(connectedParticipants.length === 0)
            {
                roomModel.gameOn = false;
                await roomModel.save();
            }
            else
                return res.status(403).send({error:"A game is going on in the room, please wait until it is finished and try again"});
        }
        
        // search if participant already exists in database
        const participant = roomModel.participants.find(participant=>{
            return participant.name === req.body.identity;
        })

        if(participant)
        {
            // check if participant is among the connected participants
            // in the room
            let twilio_participant
            try{
            twilio_participant = await client.video.rooms(req.body.room)
                                                         .participants.get(req.body.identity)
                                                         .fetch(); 
            }
            catch(err)
            {
                twilio_participant = undefined;
            }

            // if connected participant than send error message
            if(twilio_participant) return res.status(400).send({error:"User with this name already connected"});

            // else send the current score of the participant
            res.send({
                score: participant.score
            });
            // console.log(participant.score);
            
        }
        // for new participant(not in database)
        // update the database to include new participant
        else
        {
            roomModel.participants.push({
                name: req.body.identity,
                score: 0
            });

            await roomModel.save();

            res.send({
                score: 0
            });
        }
    }
    catch(err) {
        // logger.error(err.message, err);
        // The requested resource /Rooms/test was not found
        const room_not_found_patt = /Rooms\/.* was not found/;
        // room not found error
        if(room_not_found_patt.exec(err.message))
            return res.status(err.status).send({error:"Room not found"});
        else
            return res.status(err.status).send({error:err.message});
    }


})

// Method: POST
// returns status 200 on successfull creation of room
// else return error
router.post('/create', async (req, res)=> {

    const {error} = validate(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    try{

        let maxParticipants;
        let type;
        // go or group
        if(process.env.ROOM === 'go')
        {
            maxParticipants = 2;
            type = 'go';
        } 
        else
        {
            maxParticipants = 4;
            type = 'group-small';
        }

        // Create Room using twilio API
        const room = await client.video.rooms.create({
            type: type, //group-small
            uniqueName: req.body.room,
            maxParticipants: maxParticipants,
            recordParticipantsOnConnect: false,
            mediaRegion: "in1",
        });

        //-----can delete rooms before 4 hrs here------

        // Save room to mongodb
        const roomModel = new Room({
            sid: room.sid,
            participants: [{
                name: req.body.identity,
                score: 0,
            }],
            gameOn: false
        });

        await roomModel.save();
    }
    catch(err)
    {
        logger.error(err.message, err);
        return res.status(err.status).send({error:err.message});
    }

    res.status(200).send("Success");
});

// validate create POST request body
const validate = (body)=>{
    const schema = Joi.object({
        identity: Joi.string().min(4).max(128).required(),
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
}

// validate join POST request body
const validateJoin = (body)=>{
    const schema = Joi.object({
        room: Joi.string().min(3).max(128).required(),
        identity: Joi.string().min(4).max(128).required(),

    });

    return schema.validate(body);
}


module.exports = router;
