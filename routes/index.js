var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');

let Wit = require('node-wit').Wit;
let log = require('node-wit').log;

const WIT_TOKEN = process.env.WIT_TOKEN || "ZQMUMBSYZRXKHA4MSBM4Y7HMVXYXHTMF";

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
  console.log(wit);
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
              messenger.sendTextMessage(sender, 'We have received your message: ${text}.');
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

router.post('/userinput', function(req, res, next) {
	body = req.body
	console.log("----> request " + body["userinput"])
	console.log(client.message(body["userinput"]));
	res.json({
  	"redirect_to_blocks": ["In store Location"]
	})
});

module.exports = router;




