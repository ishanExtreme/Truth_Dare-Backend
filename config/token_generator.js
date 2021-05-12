// Generates Access Token to authenticate users
// https://www.twilio.com/docs/video/tutorials/user-identity-access-tokens
require('dotenv').config();
const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Max. period that a Participant is allowed to be in a 
// Room (currently 14400 seconds or 4 hours)
const MAX_ALLOWED_SESSION_DURATION = 14400;

// Create an access token which we will sign and return to the client
const generateToken = ()=> {
    return new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        {ttl: MAX_ALLOWED_SESSION_DURATION}
    );
};

const videoToken = (identity, room)=> {
    
    let videoGrant;
    // grant to specific room
    if(typeof room !== 'undefined') videoGrant = new VideoGrant({room});
    // no room specified
    else videoGrant = new videoGrant();

    const token = generateToken();
    token.identity = identity;
    // Add the grant to the token
    token.addGrant(videoGrant);
    return token.toJwt();
}

module.exports = {videoToken};

