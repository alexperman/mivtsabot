var express = require('express');
var router = express.Router();

router.get('/stores/:messenger_user_id', function(req, res, next) {
	res.render('stores');
});

router.get('/categories', function(req, res, next) {
	res.render('categories');
});

router.get('/basket', function(req, res, next) {
	res.render('basket');
});

router.get('/basketinstore', function(req, res, next) {
	res.render('basketinstore');
});

router.get('/discounts', function(req, res, next) {
	res.render('discounts');
});

module.exports = router;