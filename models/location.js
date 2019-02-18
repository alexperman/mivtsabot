var geolib = require('geolib')
var _ = require("underscore");

var dbconnection = require('../middlewares/dbconnection');
var db = new dbconnection();

const Store = require("./store")

module.exports = db.bookshelf.Model.extend({
  tableName: 'locations',  
  hasTimestamps: ['created_at', 'updated_at'],
  nearby: function(lat, lon, cb){
  	var center = {latitude: parseFloat(lat), longitude: parseFloat(lon)}
  	this.fetchAll()
		.then((locations) => {
			var arr = [];			
			console.log("---> We have " + locations.models.length)
			_.each(locations.models, (loc)=>{
				var current = {latitude: parseFloat(loc.attributes["latitude"]), longitude: parseFloat(loc.attributes["longitude"])}
				var radius = parseFloat(loc.attributes["distribution_radius"]) * 1000;								
				if(geolib.isPointInCircle( current, center, radius)){
					arr.push(loc.get('id'))
				}
			})
			cb(arr);
		})
		.catch((err) => {
	      console.log('err', err);
	      cb([]);
	  });
  }
}); 



/*

method.nearby_stores = function(cb){

	this.model.fetchAll()
		.then((locations) => {
			var locations = [];
			_.each(locations.models, (loc)=>{
				var current = {latitude: parseFloat(loc.attributes["latitude"]), longitude: parseFloat(loc.attributes["longitude"])}
				var radius = parseFloat(loc.attributes["distribution_radius"]) * 1000;								
				if(geolib.isPointInCircle( current, this.position, redius)){
					locations.push(loc);
				}
			})
			cb(locations);
		})
		.catch((err) => {
	      console.log('err', err);
	      cb([]);
	  });	
}
*/
