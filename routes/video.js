const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { videoToken } = require('../config/token_generator');

// GET method
// returns video token generated
router.get('/token', (req, res)=>{
    const identity = req.query.identity;
    const room = req.query.room;
    const token = videoToken(identity, room);
    res.send(token);
    
});

// POST method
// returns video token generated
router.post('/token', (req, res)=>{

    const {error} = validate(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    const identity = req.body.identity;
    const room = req.body.room;
    const token = videoToken(identity, room);
    res.send({token:token});
})

// validate POST request body
const validate = (body)=>{
    const schema = Joi.object({
        identity: Joi.string().min(4).max(128).required(),
        room: Joi.string().min(3).max(128).required(),
    });

    return schema.validate(body);
}

module.exports = router;