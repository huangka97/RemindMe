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
  eventId:{
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
  slackID:String,
  auth_id:String,
  token:Object,
  email:String,
  pendingInvites:[]
})

var Task=mongoose.model("Task",TaskSchema);
var Meeting=mongoose.model("Model",MeetingSchema);
