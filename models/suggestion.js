const mongoose = require('mongoose');
// const Joi = require('joi');

// Defining Room Schema
const SuggestionSchema = new mongoose.Schema({

    suggestion: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true
    }

});

// static method to get random suggestion of a particular category and type
SuggestionSchema.statics.getRandomSuggestion = async function (type, category) {
    
    const count = await this.countDocuments({type: type, category: category});

    const rand = Math.floor(Math.random() * count);

    const randomSuggestion = await this.findOne({type: type, category: category}).skip(rand);

    return randomSuggestion;

}

// Room model
const Suggestion = mongoose.model('Suggestion', SuggestionSchema);

exports.Suggestion = Suggestion;
