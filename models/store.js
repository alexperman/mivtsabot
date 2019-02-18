var geolib = require('geolib');
var _ = require("underscore");

var dbconnection = require('../middlewares/dbconnection');
var db = new dbconnection();

var Store = db.bookshelf.Model.extend({
  tableName: 'stores_extended',
  hasTimestamps: ['created_at', 'updated_at']
},{
	nearby: function(store_ids, cb){
		this.where('store_id', 'in', store_ids).fetchAll()
		.then((stores)=>{
			cb(stores);
		})
		.catch((err)=>{
			cb([])
		})
	}
}); 

module.exports = Store;