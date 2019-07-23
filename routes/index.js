var express = require('express');
var router = express.Router();

var fs = require('fs');
var parse = require('csv-parse');
var request = require('request')
var Store = require('../models/store');
var Location = require('../models/location');
var _ = require("underscore");

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

const WIT_TOKEN = "5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI" ; //|| "ZQMUMBSYZRXKHA4MSBM4Y7HMVXYXHTMF" // mivtsaim;

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FBMessenger = require('../middlewares/fb-messenger');
const messenger = new FBMessenger(FB_PAGE_TOKEN);

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: [], persona: messenger.getPersona() };
  }
  return sessionId;
};


// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  logger: new log.Logger(log.INFO)
});

router.get('/', function(req, res, next) {
	res.render('homepage');
});

// Message handler
router.post('/webhook', (req, res) => {  
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        const sender = event.sender.id;
        const sessionId = findOrCreateSession(sender);   
        var session = sessions[sessionId] 

        if (event.message && !event.message.is_echo) {  
          console.log("\t ---> EVENT context  >>> " + JSON.stringify(event));              
          console.log("\t ---> SESSION context  >>> " + JSON.stringify(session.context));    
          const {text, attachments, quick_reply} = event.message;

          if (attachments) {
            console.log("\t ATTACHMENTS >>> " + JSON.stringify(attachments));
            messenger.sendTextMessage(sender, 'Sorry I can only process text messages for now.');            
          }
          else if(quick_reply){
            console.log("\tReceive reply with  >>>" + JSON.stringify(quick_reply));
            messenger.routeReply(sender, quick_reply, sessionId, sessions)
          }                        
          else if (text) {
            //messenger.startTyping(sender, session, ()=>{}) 
            console.log("\t TEXT from the Message >>> " + text);
            wit.message(text).then(({entities}) => {              
              console.log("\t WIT response is >>> " + JSON.stringify(entities));
              messenger.routeIntents(sender, entities, sessionId, sessions);
            })
            .catch((err) => {
              console.error('\tOops! Got an error from Wit >>> ', err.stack || err);
            })
          }
        } else {
          if(event.postback)
          {         
            console.log('\tReceived POSTBACK event >>>', JSON.stringify(event)); 
          } else {            
            console.log('\tOther EVENT was received >>>', JSON.stringify(event));
          }
        }
      });
    });
  }
  res.sendStatus(200);
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

router.get('/loadcities', function(req, res, next) {
  //var csvData=[];
  fs.createReadStream('cities_7112019.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
        city_text = csvrow[0]        
        //do something with csvrow
        wit.message(city_text).then(({entities}) => {    
          console.log("\n\t City:  " + city_text + " parsed to: " + JSON.stringify(entities));
        })        
    })
    .on('end',function() {
      //do something wiht csvData
      //console.log(csvData);
      res.sendStatus(200);
    });
});


router.get('/onboarding', function(req, res, next){
  fs.createReadStream('./onboarding/address_7152019.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
      data_text = csvrow[0]        
      //do something with csvrow
      var req = {
        url: ' https://api.wit.ai/entities/street/values',
        headers: { Authorization: 'Bearer 5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI',
                   'Content-Type': 'application/json'
                  },
        method: 'POST',
        json: {
          "value": data_text
        }
      }
      request(req, function (err, res, body) {})       
    })
    .on('end',function() {
      //do something wiht csvData
      //console.log(csvData);
      res.sendStatus(200);
    });

})

router.get('/training', function(req, res, next){
  fs.createReadStream('./onboarding/address_7152019.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
      data_text = csvrow[0]        
      //do something with csvrow
      var req = {
        url: ' https://api.wit.ai/samples',
        headers: { Authorization: 'Bearer 5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI',
                   'Content-Type': 'application/json'
                  },
        method: 'POST',
        json: {
          "text": "ברח " + data_text,
          "entities": [
            {
              "entity": "intent",
              "value": "location"
            },
            {
              "entity": "street",
              "value": data_text
            }
          ]
          
        }
      }
      request(req, function (err, res, body) {})       
    })
    .on('end',function() {
      //do something wiht csvData
      //console.log(csvData);
      res.sendStatus(200);
    });

}) 
module.exports = router;




