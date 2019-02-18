var dbconnection = require('../middlewares/dbconnection');
var db = new dbconnection();
	
var ListStores = db.bookshelf.Model.extend({
	tableName: 'lists_stores',
 	hasTimestamps: ['created_at', 'updated_at']
},{
  getStores: function(listid, cb){
  	this.where('list_id', listid).fetchAll()
		.then((listsstores)=>{
			cb(listsstores)
		})
		.catch((err) => {
      console.log('err', err);
      cb(null);
  	});
  }
}); 


module.exports = ListStores