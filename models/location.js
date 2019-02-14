var geolib = require('geolib')
var _ = require("underscore");

var dbconnection = require('../middlewares/dbconnection');
var db = new dbconnection();

module.exports = db.bookshelf.Model.extend({
  tableName: 'locations',  
  hasTimestamps: ['created_at', 'updated_at'] 
}); 
