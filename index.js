const express = require('express');
require('dotenv').config();
const app = express();

// logging setup 
require('./startup/logging')();
// routes setup
require('./startup/routes')(app);

const port = process.env.PORT;
const server = app.listen(port, ()=>{
    console.log(`Listening to port ${port}`);
});