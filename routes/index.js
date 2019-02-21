var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');


router.get('/', function(req, res, next) {
	res.render('homepage');
});


router.post('/userinput', function(req, res, next) {
	console.log("----> request " + JSON.stringify(req.body))
	res.json({
  	"redirect_to_blocks": ["Welcome Message"]
	})
});

module.exports = router;