var express = require("express");
var router = express.Router();
const fs = require("fs");
const axios = require("axios");
var geolib = require("geolib");

var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'opencage',
    httpAdapter: 'https', // Default
    apiKey: '7d07bf0838804e0e9690c54da1d64cf5', // for Mapquest, OpenCage, Google Premier
    formatter: 'json' // 'gpx', 'string', ...
  };
  
var geocoder = NodeGeocoder(options);

var Store = require('../models/store');
var Location = require('../models/location');

async function convertAddrees2Point(req) {
    console.log( req.params["full_address"])
    var point = "Israel," + ","+ req.params["full_address"]
    
    try{
      const results =  await geocoder.geocode( point) ;
      //console.log(results);
      
      var demo = false;
      if(demo || results == undefined || results.length == 0){
          return  {
             "latitude": 32.16645030985006,
             "longitude": 34.92840998465561 
          }
      } else{
          return {
              "latitude": parseFloat(results[0]["latitude"]),
              "longitude": parseFloat(results[0]["longitude"]) 
          }
      }     
    } catch(err){
      console.log(err.toString());
      return {};
    }
}

function to_flutterflow(point, locations, stores){  
  return stores.map( store => {  
    //console.log("Store -- " + JSON.stringify(store) + " - - - " + store.get("name"))    
    var location = locations.find(loc => { return loc.id === store.get('location_id').toString() })
    //console.log("Location -- " + JSON.stringify(location) )
    var chain = store.related('chain')
    console.log("chain -- " + JSON.stringify(chain) )
    var geo_location =  {
      "longitude": location.get("longitude"),
      "latitude": location.get("latitude"),
    }
    var rStore = {
      "id": store.get("id"),
      "chain": chain.get("description"),
      "name": store.get("name"),
      "city": location.get("city"),
      "address": location.get("address"),
      "chain_img": chain.get("name"),
      "discounts_no":  Math.round((Math.random() * (250 - 75) + 75)),
      "location": geo_location,
      "distance_in_metr": geolib.getDistance(point, geo_location, accuracy = 1),    

    }
    console.log("rStore -- " + JSON.stringify(rStore))
    return rStore; 
  })
}

//  http://localhost:3001/flutterflow/supermarkets/פתח תקווה/משה סנה 32
router.get("/supermarkets/:full_address", async function (req, res, next) {
    try{
      var point = await convertAddrees2Point(req);
      console.log("Point: " + JSON.stringify(point));
      const location = new Location();       
      location.byPoint(point, (near_locations) => {
        console.log("Near " + near_locations.length);
        
        const store = new Store();      
        store.nearby(near_locations, (stores)=>{
          res.status(201).send(to_flutterflow(point, near_locations, stores));
        });
      });
    } catch(err){
      res.status(201).json({ error: err.message || err.toString() });
    }
});

//http://localhost:3001/flutterflow/superproducts/1-2-3-4/100
router.get("/superproducts/:supermarkets/:category", function (req, res, next) {
    res.status(201).send( req.params["supermarkets"], req.params["category"]);
});


module.exports = router;
