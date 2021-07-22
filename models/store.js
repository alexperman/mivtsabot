var geolib = require("geolib");
var _ = require("underscore");

var dbconnection = require("../middlewares/dbconnection");
var db = new dbconnection();
var Chain = require("../models/chain")

let Store = db.bookshelf.model(
  "Store",
  {
    tableName: "stores",
    hasTimestamps: ["created_at", "updated_at"],
    chain: function() {
      return this.belongsTo(Chain);
    },
    nearby: function (locations, cb) {
      if (locations.length == 0){return cb([]); }
      this.query(function(qb) {
        qb.select('id', 'name', 'location_id', 'chain_id')
        qb.whereIn("location_id", locations.map((id) => id.id));
        //console.log(JSON.stringify(qb));
      })
        .fetchAll({
          withRelated: [{'chain': function(qb) {
            qb.column('id', 'name', 'description');
          }}]
        })
        .then((stores) => {
          console.log("Stores -->" + stores.models.length);
          if (stores.models.length > 0) {
            cb(stores.models);
          } else {
            cb([]);
          }
        })
        .catch((err) => {
          console.log("err", err);
          cb([]);
        });
    },
  },
  {
    jsonColumns: ["products_json", "discounts_json"],
  }
);


module.exports = Store;
