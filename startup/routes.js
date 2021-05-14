const express = require('express');
require('dotenv').config();
const video = require('../routes/video');
const room = require('../routes/room');
const game = require('../routes/game');
const error = require('../middleware/error');

module.exports = (app)=>{
    app.use(express.json());

    // allow same origin(remove in prod env)
    
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    

    // routes
    app.use('/api/video', video);
    app.use('/api/room', room);
    app.use('/api/game', game);    
    app.use(error);
}