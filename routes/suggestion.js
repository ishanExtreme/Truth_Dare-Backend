const express = require('express');
require('dotenv').config();
const router = express.Router();
const Joi = require('joi');
const logger = require('../middleware/logger');
const { Suggestion } = require('../models/suggestion');

router.post('/create', async (req, res)=>{

    const {error} = validateCreate(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    const suggestion = new Suggestion({
        suggestion: req.body.suggestion,
        category: req.body.category,
        type: req.body.type
    });

    await suggestion.save();

    res.status(200).send("success");

});

router.post('/get_random', async (req, res)=>{

    const {error} = validateGetRandom(req.body);
    if(error) return res.status(400).send({error: error.details[0].message});

    const randSuggestion = await Suggestion.getRandomSuggestion(req.body.type, req.body.category);

    if(randSuggestion)
        res.send({suggestion: randSuggestion.suggestion});
    else
        res.send({suggestion: "Out Of Suggestions"});

});

// validate create POST request body
const validateCreate = (body)=>{
    const schema = Joi.object({
        suggestion: Joi.string().required(),
        type: Joi.string().required(),
        category: Joi.string().required(),
    });

    return schema.validate(body);
};

// validate get random POST request body
const validateGetRandom = (body)=>{
    const schema = Joi.object({
        type: Joi.string().required(),
        category: Joi.string().required(),
    });

    return schema.validate(body);
};

module.exports = router;