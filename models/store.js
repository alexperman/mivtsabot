var geolib = require("geolib");
var _ = require("underscore");

var dbconnection = require("../middlewares/dbconnection");
var db = new dbconnection();
var Chain = require("../models/chain")
var Location = require("../models/location")

let Store = db.bookshelf.model(
  "Store",
  {
    tableName: "stores",
    hasTimestamps: ["created_at", "updated_at"],
    chain: function() {
      return this.belongsTo(Chain);
    },
    location: function() {
      return this.belongsTo(Location);
    },
    markers: function (cb) {
      this.query(function(qb) {
        qb.select('id', 'location_id')
      })
      .fetchAll({
        withRelated: [{'location': function(qb) {
          qb.column('id', 'latitude', 'longitude');
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
          }},{'location': function(qb) {
            qb.column('id', 'latitude', 'longitude');
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
    load_stores: function(store_ids, cb) {
      if (store_ids.length == 0){ cb([]); }

      this.query(function(qb) {        
        qb.whereIn("id", store_ids.split(","));
        //console.log(JSON.stringify(qb));
      })
        .fetchAll({
          withRelated: [{'chain': function(qb) {
            qb.column('id', 'name', 'description');
          }},
          {'location': function(qb) {
            qb.column('id', 'city', 'address', 'status', 'latitude', 'longitude');
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
