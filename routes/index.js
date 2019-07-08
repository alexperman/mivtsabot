var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');
const {Wit, log} = require('node-wit');

const client = new Wit({
  accessToken: "ZQMUMBSYZRXKHA4MSBM4Y7HMVXYXHTMF",
  logger: new log.Logger(log.DEBUG) // optional
});

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
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
router.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "EAAHxiqhXpPEBANZBmplAaPMtSvjSvwF6jwHzK5sUcw7f2YJOeoWcyNASldwH4C3WnlIOSOiaBPvDDZAVGYllxWj8ZAyhCwIgsTwP4eli9rsT22ozN23v2ZAFLLw4JgBlSa5iJHttBc2RiV6WJRjTbZAIMTyQFA2oxeoL6jjvP2QZDZD"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
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




