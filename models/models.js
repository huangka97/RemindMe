var mongoose=require("mongoose");
var Schema=mongoose.Schema;

var TaskSchema=new Schema({
  subject:{
    type:String,
    required:true
  },
  day:{
    type:String,
    required:true
  },
  calendarEventId:{
    type:String,
  },
  requesterId:{
    type:String,
  }
});

var MeetingSchema=new Schema({
  day:{
    type:String,
    required:true
  },
  time:{
    type:String,
    required:true
  },
  invitees:{
    type:String,
    required:true
  },
  subject:{
    type:String,
  },
  location:{
    type:String,
  },
  meetingLength:{
    type:String,
  },
  calendarFields:{
    type:String,
  },
  status:{
    type:String,
  },
  createdAt:{
    type:String,
  },
  requesterId:{
    type:String
  }

});

var UserSchema=new Schema({
  accessToken:{
    type:String,
  },
  refreshToken:{
    type:String,
  },
  googleProfileId:{
    type:String,
  },
  defaultMeetingTime:{
    type:String,
  },
  slackID:{
    type:String,
  },
  slackEmail:{
    type:String,
  },
  slackDMIds:{
    type:String,
  }
});

var InviteSchema=new Schema({
  eventId:{
    type:String,
  },
  inviteeId:{
    type:String,
  },
  requesterId:{
    type:String,
  },
  status:{
    type:String,
  }
})

var Task=mongoose.model("Task",TaskSchema);
var Meeting=mongoose.model("Model",MeetingSchema);
var User=mongoose.model("User",UserSchema);
var Invite=mongoose.model("Invite",InviteSchema);


module.exports={
  Task:Task,
  Meeting:Meeting,
  User:User,
  Invite:Invite
}
