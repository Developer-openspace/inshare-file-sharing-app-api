const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Cors 
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(',')
  // ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3300']
}

// Default configuration looks like
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
//   }

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cors(corsOptions))
app.use(express.json());

// Routes 
app.use('/api', require('./routes/api'));

mongoose.connect(process.env.MONGO_CONNECTION_URL, {
    useNewUrlParser: true, 
    useCreateIndex:true, 
    useUnifiedTopology: true, 
    useFindAndModify : true 
});
const connection = mongoose.connection;
connection.once('open', () => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT,()=>{
      console.log(`Listening on port ${PORT}.`)
    });
}).catch(err => {
    console.log('Connection failed ☹️☹️☹️☹️');
});

