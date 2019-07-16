var express = require('express');
var router = express.Router();

var fs = require('fs');
var parse = require('csv-parse');
var request = require('request')
var Store = require('../models/store');
var Location = require('../models/location');

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

const WIT_TOKEN = "5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI" ; //|| "ZQMUMBSYZRXKHA4MSBM4Y7HMVXYXHTMF" // mivtsaim;

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FBMessenger = require('../middlewares/fb-messenger');
const messenger = new FBMessenger(FB_PAGE_TOKEN);

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
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We could retrieve the user's current session, or create one if it doesn't exist
          // This is useful if we want our bot to figure out the conversation history
          // const sessionId = findOrCreateSession(sender);
          console.log(event.message);
          // We retrieve the message content
          const {text, attachments} = event.message;

          if (attachments) {
            console.log(attachments);
            // We received an attachment
            // Let's reply with an automatic message            
            messenger.sendTextMessage(sender, 'Sorry I can only process text messages for now.');            
          } else if (text) {
            console.log(text);
            // We received a text message
            // Let's run /message on the text to extract some entities
            wit.message(text).then(({entities}) => {
              // You can customize your response to these entities
              console.log(entities);
              // For now, let's reply with another automatic message
              messenger.sendTextMessage(sender, 'wit.ai: ' + JSON.stringify(entities));
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
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
  fs.createReadStream('../onboarding/address_7152019.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
      data_text = csvrow[0]        
      //do something with csvrow
      var req = {
        url: ' https://api.wit.ai/entities/address/values',
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


module.exports = router;




