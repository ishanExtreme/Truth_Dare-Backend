const mongoose = require('mongoose');
// const Joi = require('joi');

// Defining Room Schema
const RoomSchema = new mongoose.Schema({

    createdAt: {
        type: Date,
        // expires after 4 hrs from creation(14400)
        expires: 14400,
        default: Date.now()
    },

    sid: {
        type: String,
        required: true
    },

    participants: [{
        name: String,
        score: Number,
    }],

    gameOn: {
        type: Boolean,
        default: false,
        required: true
    }

});

// Room model
const Room = mongoose.model('Room', RoomSchema);

exports.Room = Room;
