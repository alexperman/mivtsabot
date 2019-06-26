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


router.post('/userinput', function(req, res, next) {
	body = req.body
	console.log("----> request " + body["userinput"])
	console.log(client.message(body["userinput"]));
	res.json({
  	"redirect_to_blocks": ["In store Location"]
	})
});

module.exports = router;