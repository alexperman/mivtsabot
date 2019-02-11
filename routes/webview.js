var express = require('express');
var router = express.Router();

router.get('/stores', function(req, res, next) {
	res.render('stores');
});

router.get('/categories', function(req, res, next) {
	res.render('categories');
});

module.exports = router;