var express = require('express');
var router = express.Router();

var geolib = require('geolib')
var _ = require("underscore");

var ListStores = require('../models/liststores');
var Store = require('../models/store');

router.get('/stores/:listid/:lat/:lon', function(req, res, next) {
	var center = {latitude: parseFloat(req.params["lat"]), longitude: parseFloat(req.params["lon"])}
	ListStores.getStores(req.params["listid"], (listsstores)=>{
		var models =listsstores.models;
		console.log("-----> Received list ["+models.length+"] >>>"+ JSON.stringify(models))
		if(models.length > 0){
			var store_ids = []
			_.each(models, (m)=>{
				store_ids.push(m.get("store_id"))
			})
			Store.nearby(store_ids, (stores)=>{				
				var s = _.map(stores.models, (store)=>{
						var current = {latitude: parseFloat(store.get("latitude")), longitude: parseFloat(store.get("longitude"))}
						return {
							'id': store.get("store_id"),
							'chain': store.get("chain"),
							'name': store.get("store_name"),
							'img_url': chain_image[store.get("chain_uid")],
							'distance': geolib.getDistance(current, center) 
						}
					})
				console.log("------> So we have stores "+ JSON.stringify(s))
				res.render('stores', {data: s});	
			})
		} else {
			res.render('stores', {data: [] });	
		}
	})
	
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


var chain_image = {
	"7290633800006": "/img/coop.jpg",
	"7290103152017": "/img/osherad.jpg",
	"7290172900007": "/img/superpharm.png",
	"7290696200003": "/img/victory.jpg",
	"7290492000005": "/img/doralon.jpg",
	"7290058179503": "/img/mahsaneilahav.jpg",
	"7290058140886": "/img/ramilevy.jpg",
	"7290785400000": "/img/keshettaamim.jpg",
	"7290058140886": "/img/zolvebegadol.jpg",
	"7290873900009": "/img/superdush.jpg",
	"7290027600007": "/img/shufersal.jpg",
	"7290055700007": "/img/mega.jpg",
	"7290725900003": "/img/ybitan.jpg",
	"7290661400001": "/img/mahsaneihashuk.jpg",
	"7290307000008": "/img/newpharm.jpg",
	"7290058148776": "/img/shukhair.jpg",
	"7290873255550": "/img/tivtam.jpg",
	"7290908777774": "/img/edenteva.jpg",
	"7290875100001": "/img/bareket.jpg",
	"7290058108879": "/img/kingstore.jpg",
	"7290639000004": "/img/stopmarket.jpg",
	"7290526500006": "/img/salahdabah.jpg",
	"7290876100000": "/img/freshmarket.jpg",
	"7290803800003": "/img/yohananof.jpg",
	"7290700100008": "/img/hazihinam.jpg"
}