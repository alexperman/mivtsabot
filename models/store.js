var dbconnection = require('../middlewares/dbconnection');
var db = new dbconnection();
	
module.exports = db.bookshelf.Model.extend({
  tableName: 'stores',
  hasTimestamps: ['created_at', 'updated_at']
}); 
