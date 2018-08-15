const express = require('express');
// const bodyParser = require('body-parser')
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const assert = require('assert')
const router = express.Router()

router.use(express.static(path.join(__dirname, 'build')));

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

router.get('/ping', (req, res) => {
  console.log("pong")
})

router.post('/buttonPostConfirm', (req, res) => {
  console.log("button pressed", req.body)
  console.log("req payload", req.body.payload)

})

export default router
