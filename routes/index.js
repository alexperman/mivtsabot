var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');


router.get('/', function(req, res, next) {
	res.render('homepage');
});

module.exports = router;