var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');


const {Wit, log} = require('node-wit');
const client = new Wit({
  accessToken: "ZQMUMBSYZRXKHA4MSBM4Y7HMVXYXHTMF",
  logger: new log.Logger(log.DEBUG) // optional
});

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FBMessenger = require('../middlewares/fb-messenger');
const messenger = new FBMessenger(FB_PAGE_TOKEN);


router.get('/', function(req, res, next) {
	res.render('homepage');
});


router.post('/webhook', (req, res) => {  
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      if (entry.messaging) {
        entry.messaging.forEach(function(messagingObject) {
          var senderId = messagingObject.sender.id;
          if (messagingObject.message) {
            var messageText = messagingObject.message.text;
            messenger.sendTextMessage(senderId, messageText);
          } else if (messagingObject.postback) {
            console.log('Recieved postback');
          }
        });
      } else {
        console.log('no message key found');
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }



/*
 console.log("\t >>>> Received request: " + JSON.stringify(req.body) );
  var messaging = req.body.object;
  
  if (messaging ) {
    if ( messaging.recipient.id != FB_PAGE_ID){
      console.log("\t !!!-> Process not mine message !!!");    
      return
    }

    const sender = messaging.sender.id;        
    const sessionId = findOrCreateSession(sender);
    const recipientId = sessions[sessionId].fbid;
    console.log("\t ---> sender " + sender);
    console.log("\t ---: sessionid " + sessionId);
    console.log("\t ---: recipientId " + recipientId);
    
    if(sessions[sessionId].recipient == null || sessions[sessionId].recipient == undefined){
      messenger.getProfile(recipientId, (err, data) => {
        sessions[sessionId].recipient = data;
        console.log("\t ---> user profile: " + JSON.stringify(sessions[sessionId].recipient));  
      });      
    }

    console.log("\t ---> session context : " + JSON.stringify(sessions[sessionId].context));

    var exceptional_case = false;
    if(messaging.message && messaging.message.attachments && messaging.message.attachments.type == 'location'){
      exceptional_case = true;
    }

    if(sessions[sessionId].location == {} && !exceptional_case){
      messenger.sendQuickReplies(recipientId, "שלח לי בבקשה את איזור הגאוגראפי בו תרצה לבדוק מבצעים ;)" , [ { "content_type": "location" }]);
    }
    else if (messaging.message){
      const atts = messaging.message.attachments;
      const quick_reply = messaging.message.quick_reply;
      
      if( atts != null){       
        attachment.respond(messenger, recipientId, atts, sessions[sessionId].context); 
      }
      else if( quick_reply != null){         
          console.log("\t ---> postback PAYLOAD action: " + messaging.message.text);
          postback(quick_reply.payload, recipientId, sessions[sessionId].context, messenger, sessions[sessionId].recipient);        
      }
      else{
          console.log("\t ---> wit text process: " + messaging.message.text);
          wit.run_actions(messenger, sessionId, messaging.message.text, sessions);        
      }
    } 
    else if (messaging.postback){
      console.log("\t ---> postback action: " + messaging.postback.payload);      
      postback(messaging.postback.payload, recipientId, sessions[sessionId].context, messenger, sessions[sessionId].recipient);  
    } 
    else {
      console.log("\t ---> received message format is not supported !!!");
      messenger.sendTextMessage(recipientId, "תודה על פניתך");
    }    
  } else {
    console.log("\t ---> message is null or reciever of the message is not a FB page");
  }
  res.sendStatus(200);


*/




});

// Adds support for GET requests to our webhook
router.get('/webhook', (req, res) => {
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

router.post('/userinput', function(req, res, next) {
	body = req.body
	console.log("----> request " + body["userinput"])
	console.log(client.message(body["userinput"]));
	res.json({
  	"redirect_to_blocks": ["In store Location"]
	})
});

module.exports = router;




