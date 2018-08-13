const { RTMClient,WebClient } = require('@slack/client');

var google=require('googleapis');
var slackID;
var axios=require('axios');
// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
const token = process.env.SLACK_TOKEN;
const rtm=new RTMClient(token);

const web = new WebClient(token);

rtm.start();
// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = 'DC7PSNMJN';

rtm.on('message', function (event) {
  console.log(event)
  if(event.previous_message) console.log('@@@@', JSON.stringify(event.previous_message, null,2))
  // The RTM client can send simple string messages
  //rtm.sendMessage('Hello there', event.channel, function(err, res) {
  //  console.log(err, res);
  //})
  if (event.bot_id === "BC8NBNYEB") return
  web.chat.postMessage({
    channel: conversationId,
    as_user: true,
    'text': 'Would you like to schedule a meeting?',
    //response_url: "", webhook
    'attachments': [
      {
        'text': 'Choose a game to play',
        'fallback': 'You are unable to choose a game',
        'callback_id': 'wopr_game',
        'color': '#3AA3E3',
        'attachment_type': 'default',
        'actions': [
          {
            'name': 'game',
            'text': 'Chess',
            'type': 'button',
            'value': 'chess'
          },
          {
            'name': 'game',
            'text': 'Falken\'s Maze',
            'type': 'button',
            'value': 'maze'
          },
          {
            'name': 'game',
            'text': 'Thermonuclear War',
            'style': 'danger',
            'type': 'button',
            'value': 'war',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'Wouldn\'t you prefer a good game of chess?',
              'ok_text': 'Yes',
              'dismiss_text': 'No'
            }
          }
        ]
      }
    ]
  })
    .then((res) => {
      // `res` contains information about the posted message
      console.log('Message sent: ', res.ts)
    })
    .catch(console.error)
})


// See: https://api.slack.com/methods/chat.postMessage
// schedulerbot
// rtm.sendMessage('Test1', conversationId)
//   .then((res) => {
//     // `res` contains information about the posted message
//     console.log('Message sent: ', res.ts);
//   })
//   .catch(console.error);
// //scheduler-bot
// web.chat.postMessage({ channel: conversationId, text: 'Hello there' })
//   .then((res) => {
//     // `res` contains information about the posted message
//     console.log('Message sent: ', res.ts);
//   })
//   .catch(console.error);
