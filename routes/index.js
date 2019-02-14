var express = require('express');
var router = express.Router();

var Store = require('../models/store');
var Location = require('../models/location');


router.get('/', function(req, res, next) {
	res.render('homepage');
});

router.get('/stores', function(req, res, next) {	
	var location = new Location()
	location.nearby(req.query["latitude"], req.query["longitude"], (location_ids)=>{
		if(location_ids.length == 0){
			res.json({"messages": [{"text": "Nada"}]})
		} else{
			Store.forge().where('location_id', 'in', location_ids).fetchAll()
			.then((stores)=>{
				res.json(stores);
			})
			.catch((err) => {
	      console.log('err', err);
	      res.json({"messages": [{"text": "Nada"}]})
	  	});
		}
	})
});




module.exports = router;