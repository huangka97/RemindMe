// const { RTMClient,WebClient } = require('@slack/client');
import {RTMClient, WebClient} from '@slack/client'
import {google} from 'googleapis'
import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios';
import router from './routes.js'
import models from "./models/models"
import mongoose from 'mongoose'

const User = models.User

var slackID;
const app = express()
var token1;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', router)

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.SLACK_TOKEN;
const rtm = new RTMClient(token);
const web = new WebClient(token);
// const TOKEN_PATH = 'token.json';

// https://developers.google.com/calendar/quickstart/nodejs
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
)

// ask user for access to their calendar
// console.log('open URI:',oauth2Client.generateAuthUrl({
//   access_type: 'offline',
//   state: 'DEMIMAGIC_ID', // meta-data for DB
//   scope: [
//     'https://www.googleapis.com/auth/calendar'
//   ]
// }))
let rando=0;
function createAuthUrl(){
  console.log("ENTERED CREATE AUTH URL");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar'
    ]
  })


  rtm.sendMessage(`Click on the following url ${authUrl}`, conversationId, (err,res)=>{
    if(res){
      console.log("success")
    }else{
      console.log("failure")
    }
  })

}





// Google API create cal event

function makeCalendarAPICall(token) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});

  // calendar.events.insert({
  //   calendarId: 'primary', // Go to setting on your calendar to get Id
  //   'resource': {
  //     'summary': 'Google I/O 2015',
  //     'location': '800 Howard St., San Francisco, CA 94103',
  //     'description': 'A chance to hear more about Google\'s developer products.',
  //     'start': {
  //       'dateTime': '2018-08-15T02:00:35.462Z',
  //       'timeZone': 'America/Los_Angeles'
  //     },
  //     'end': {
  //       'dateTime': '2018-08-16T02:10:35.462Z',
  //       'timeZone': 'America/Los_Angeles'
  //     },
  //     'attendees': [
  //       {'email': 'tchang2017@example.com'},
  //     ]
  //   }
  // }, (err, {data}) => {
  //   if (err) return console.log('The API returned an error: ' + err);
  //   console.log(data)
  // })
  // return;


  calendar.events.list({
    calendarId: 'primary', // Go to setting on your calendar to get Id
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, {data}) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

// Google OAuth2 callback
app.get(process.env.REDIRECT_URL.replace(/https?:\/\/.+\//, '/'), (req, res) => {
  oauth2Client.getToken(req.query.code, function (err, token) {
    if (err) return console.error(err.message)

    var newUser = new User({
      accessToken : token.access_token,
      refreshToken: token.refresh_token
      slackID:
    })
    newUser.save()
    .then((saved) => console.log("user token saved", saved))
    .catch((err) => console.log("user not saved", err))

    // console.log('token', token, 'req.query:', req.query) // req.query.state <- meta-data

    // console.log("token1 saved", token1)

    makeCalendarAPICall(token)
    res.send('ok')

  })

})

// makeCalendarAPICall({
//   access_token: '???',
//   token_type: 'Bearer',
//   refresh_token: '???',
//   expiry_date: 1530585071407
// })



rtm.start();

let conversationId;

rtm.on('message', function (event) {
  conversationId = event.channel
  console.log(event)
  if(event.previous_message) console.log('@@@@', JSON.stringify(event.previous_message, null,2))
  DialogFlow(event.text, event.user)
})



// slack Webhook
app.post('/slack', (req, res) => {
  console.log("reached /slack route")
  console.log('>>>', JSON.parse(req.body.payload))
  res.end()
})

app.listen(1337)



const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();



//send user text to dialogflow
function DialogFlow(text, id) {
  const sessionId = id;
  slackID=id;
  User.update({ : id }, { $set: {slackID: id }}, callback);
  const sessionPath = sessionClient.sessionPath(process.env.DIALOGFLOW_PROJECT_ID, sessionId);
  console.log("User id", sessionId)
  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: 'en-US',
      },
    },
  };

  sessionClient.detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult;
      // console.log('Detected intent', result.parameters.fields);
      // console.log(`  Query: ${result.queryText}`);
      // console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
        if (result.fulfillmentText !== '') {
          rtm.sendMessage(result.fulfillmentText, conversationId, (err, res) => {
            if (res) {
              console.log("dialog response sent", res)
            } else {
               console.log("dialog error, err")
             }
          })
        } else {
          console.log("TEST BITCHES");
          console.log("THIS IS RANDOM BITCHES:",rando);
          User.findOne({slackID:slackID},function(error,id){
            if(error){
              console.log("error finding usertoken")
            }else if(id){
              console.log("id found", id)
              console.log("found user id");
              makeCalendarAPICall(id.token);
              return;
            }else if(!token){
              console.log("entered third condition");
              createAuthUrl();
            }
          })


          }
        }else{
          console.log("No intent matched.");
        }

    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}
