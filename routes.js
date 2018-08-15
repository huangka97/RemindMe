const express = require('express');
// const bodyParser = require('body-parser')
import {RTMClient, WebClient} from '@slack/client'
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const assert = require('assert')
const router = express.Router()

// router.use(express.static(path.join(__dirname, 'build')));
// router.use(bodyParser.json())

if (! fs.existsSync('./env.sh')) {
  throw new Error('env.sh file is missing');
}
if (! process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not in the environmental variables. Try running 'source env.sh'");
}
mongoose.connection.on('connected', function() {
  console.log('Success: connected to MongoDb!');
});
mongoose.connection.on('error', function() {
  console.log('Error connecting to MongoDb. Check MONGODB_URI in env.sh');
  process.exit(1);
});
mongoose.connect(process.env.MONGODB_URI);

export default function(rtm, web) {
  router.get('/ping', (req, res) => {
    console.log("pong")
  })

  router.post('/buttonPostConfirm', (req, res) => {
    let payload = JSON.parse(req.body.payload)
    console.log("req payload", payload)
    console.log("payload actions", payload.actions)
    let conversationId = payload.channel.id
    if (payload.actions[0].name === "yes") {
      console.log("made it here name = yes")
      //make calender
      rtm.sendMessage("Your reminder has been created in the calender!", conversationId, (err, res) => {
        if (res) {
          console.log("reminder saved post confirm", res)
        } else {
          console.log("cofirm button err", err)
        }
      })
    } else {
      rtm.sendMessage("Reminder canceled", conversationId, (err, res) => {
        if (res) {
          console.log("reminder canceled hit res", res)
        } else {
          console.log("error canceling reminder", err)
        }
      })
    }
  })
  return router
}
