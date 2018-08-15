import {RTMClient, WebClient} from '@slack/client'
import {google} from 'googleapis'
import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios';
import router from './routes.js'
import models from "./models/models"
import mongoose from 'mongoose'

const User = models.User
let slackID;
const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use('/', router)

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.SLACK_TOKEN;
const rtm = new RTMClient(token);
const web = new WebClient(token);

// https://developers.google.com/calendar/quickstart/nodejs
const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL)

function createAuthUrl(token, time, subject, date) {
  console.log("ENTERED CREATE AUTH URL");
  const authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: ['https://www.googleapis.com/auth/calendar']})

  rtm.sendMessage(`Click on the following url ${authUrl}`, conversationId, (err, res) => {
    if (res) {
      console.log("success")
      makeCalendarAPICall(token, time, subject, date)
    } else {
      console.log("failure")
    }
  })
}

// Google API create cal event

function makeCalendarAPICall(token, time, subject, date) {
  const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL)

  oauth2Client.setCredentials(token)
  console.log("TIME CHECK", time);
  console.log("DATE", date);

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log(tokens.refresh_token);
    }
    console.log(tokens.access_token);
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  console.log('THIS IS TIME FAM BAM: ', time);
  if(isMeeting){
    calendar.events.insert({
      calendarId: 'primary', // Go to setting on your calendar to get Id
      'resource': {
        'summary': subject,
        'description': subject,
        'start': {
          'dateTime': time,
          'timeZone': 'America/Los_Angeles'
        },
        'end': {
          'dateTime': endTime,
          'timeZone': 'America/Los_Angeles'
        },
        'attendees': [
          {
            'email': 'tchang2017@example.com'
          }
        ]
      }
    }, (err, {data}) => {
      if (err)
        return console.log('The API returned an error: ' + err);
      console.log(data)
    })
  }
  else{
  calendar.events.insert({
    calendarId: 'primary', // Go to setting on your calendar to get Id
    'resource': {
      'summary': subject,
      'description': subject,
      'start': {
        'dateTime': time,
        'timeZone': 'America/Los_Angeles'
      },
      'end': {
        'dateTime': time,
        'timeZone': 'America/Los_Angeles'
      },
      'attendees': [
        {
          'email': 'tchang2017@example.com'
        }
      ]
    }
  }, (err, {data}) => {
    if (err)
      return console.log('The API returned an error: ' + err);
    console.log(data)
  })}
  return;

  // calendar.events.list({
  //   calendarId: 'primary', // Go to setting on your calendar to get Id
  //   timeMin: (new Date()).toISOString(),
  //   maxResults: 10,
  //   singleEvents: true,
  //   orderBy: 'startTime'
  // }, (err, {data}) => {
  //   if (err)
  //     return console.log('The API returned an error: ' + err);
  //   const events = data.items;
  //   if (events.length) {
  //     console.log('Upcoming 10 events:');
  //     events.map((event, i) => {
  //       const start = event.start.dateTime || event.start.date;
  //       console.log(`${start} - ${event.summary}`);
  //     });
  //   } else {
  //     console.log('No upcoming events found.');
  //   }
  // });
}

// Google OAuth2 callback
app.get(process.env.REDIRECT_URL.replace(/https?:\/\/.+\//, '/'), (req, res) => {
  oauth2Client.getToken(req.query.code, function(err, token) {
    if (err)
      return console.error(err.message)
      //HERE IS WHERE YOU LOOK AT TOKEN
    console.log("user token", token)
    var newUser = new User({accessToken: token.access_token, refreshToken: token.refresh_token, slackID: slackID})
    newUser.save().then((saved) => console.log("user token saved", saved)).catch((err) => console.log("user not saved", err))
    // console.log('token', token, 'req.query:', req.query)  req.query.state <- meta-data
    res.send('ok')
  })
})

rtm.start();

let conversationId;

rtm.on('message', function(event) {
  conversationId = event.channel
  slackID = event.user;
  console.log("THIS IS EVENT " ,event);
  console.log("THIS IS COMPARISON TEST FAM: ",event.bot_id,event.user);
  if (event.previous_message)
    console.log('@@@@', JSON.stringify(event.previous_message, null, 2))
  if (event.bot_id) {
    return;
  } else {
    DialogFlow(event.text, event.user)
  }
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
  const sessionPath = sessionClient.sessionPath(process.env.DIALOGFLOW_PROJECT_ID, sessionId);

  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: 'en-US'
      }
    }
  };

  sessionClient.detectIntent(request).then(responses => {
    const result = responses[0].queryResult;
    // console.log('Detected intent', result.parameters.fields);
    // console.log(`  Query: ${result.queryText}`);
    // console.log(`  Response: ${result.fulfillmentText}`);
    // console.log("THIS IS RESULT FAM: ", result);
    // console.log("THIS IS RESULT FAM intent: ", result.intent);

    if (result.intent) {
      //THIS IS WHERE WE CAN DETECT WHAT THE INTENT IS
      console.log(`  Intent: ${result.intent.displayName}`);
      if (result.fulfillmentText !== '') {
        rtm.sendMessage(result.fulfillmentText, conversationId, (err, res) => {
          if (res) {
            console.log("dialog response sent", res)
          } else {
            console.log("dialog error, err")
          }
        })
      } else if (result.intent.displayName == 'reminder:add') {
        // console.log("THIS IS SLACK ID ",slackID);
        // console.log("THIS IS RESULT",result);
        console.log("fields i want to parse", result.parameters.fields)
        let time = result.parameters.fields.time.stringValue;
        let parsedTime = time.slice(11, time.length)
        let subject = result.parameters.fields.subject.stringValue;
        let date = result.parameters.fields.date.stringValue;
        console.log("THIS IS THE DATE OBJECT: ", new Date(date));
        let parsedDate = date.slice(0, 11)
        // let dateObject=new Date(date);
        // dateObject.setHours(dateObject.getHours()+1);
        let fullTimeDate = parsedDate.concat(parsedTime)
        // let fullTimeDate=dateObject;
        // console.log(result);
        // console.log(fullTime)
        console.log("THIS IS FULL TIME DATE FAM: ", fullTimeDate)
        User.findOne({slackID: slackID}).then((user) => {
          if (user) {
            // console.log("USER FOUND", user)
            let token = {
              access_token: user.accessToken,
              refresh_token: user.refreshToken,
              scope: 'https://www.googleapis.com/auth/calendar',
              expiry_date: 1534290086191
            }

            console.log("THIS IS CHANNEL: ", conversationId);
            web.chat.postMessage({
              channel: conversationId,
              text: 'Set Reminder',
              "attachments": [
                {
                  "fields": [
                    {
                      "title": "Subject",
                      "value": subject
                    }, {
                      "title": "Date",
                      "value": date
                    }
                  ],
                  "fallback": "You are unable to choose a game",
                  "callback_id": "wopr game",
                  "color": "#3AA3E3",
                  "attachment_type": "default",
                  "actions": [
                    {
                      "name": "yes",
                      "text": "Confirm",
                      "type": "button",
                      "value": "true"
                    }, {
                      "name": "no",
                      "text": "Cancel",
                      "type": "button",
                      "value": "false"
                    }
                  ]
                }
              ]
            }).then((res) => {
              console.log("THIS IS RES", res);
            }).catch((err) => console.log("ERROR FAM: ", err));

          } else {
            console.log("User not found so create new token");
            createAuthUrl(token, fullTimeDate, subject, date);
          }
        }).catch((err) => {
          console.log("user not found: this is error fam ", err)
        })
      }
    } else if (result.intent.displayName === "schedule:add") {
      console.log("THIS SHIT WORKS BITCHES");

    } else {
      console.log("No intent matched.");
    }
  }).catch(err => {
    console.error('ERROR:', err);
  });
}
