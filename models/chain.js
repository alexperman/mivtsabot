var _ = require("underscore");

var dbconnection = require("../middlewares/dbconnection");
var db = new dbconnection();
var Store = require('../models/store');

let Chain = db.bookshelf.model('Chain', {
  tableName: 'chains', 
  hasTimestamps: ["created_at", "updated_at"],
  stores() {
    return this.hasMany(Store, 'chain_id')
  }
});

module.exports = Chain;
