var geolib = require("geolib");
var _ = require("underscore");

var dbconnection = require("../middlewares/dbconnection");
var db = new dbconnection();
var Store = require('../models/store');

let Location = db.bookshelf.model("Location", {
  tableName: "locations",
  hasTimestamps: ["created_at", "updated_at"],
  stores() {
    return this.hasMany(Store, 'location_id')
  },
  byPoint: function (center, cb) {
    var bounds = geolib.getBoundsOfDistance(center, 1000);
    console.log(bounds);
    this.query(function(qb){
        qb.where("latitude", ">=",  bounds[0]["latitude"])
        qb.andWhere("longitude", ">=",  bounds[0]["longitude"])
        qb.andWhere("latitude", "<=",  bounds[1]["latitude"])
        qb.andWhere("longitude", "<=",  bounds[1]["longitude"])        
      })
      .fetchAll()
      .then((locations) => {
        console.log("---> We have " + locations.models.length);
        if (locations.models.length > 0) {
          cb(locations.models);
        } else {
          cb([]);
        }
      })
      .catch((err) => {
        console.log("err", err);
        cb([]);
      });
  },
});

module.exports = Location;
