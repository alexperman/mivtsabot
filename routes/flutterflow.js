var express = require("express");
var cors = require('cors')
var router = express.Router();
const fs = require("fs");
const axios = require("axios");
var geolib = require("geolib");

var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'opencage',
    httpAdapter: 'http', // Default
    apiKey: '7d07bf0838804e0e9690c54da1d64cf5', // for Mapquest, OpenCage, Google Premier
    formatter: 'json' // 'gpx', 'string', ...
  };
  
var geocoder = NodeGeocoder(options);

var Store = require('../models/store');
var Location = require('../models/location');

const store_img = {
  "tivtam": "https://supermarkets.s3.eu-central-1.amazonaws.com/tivtam_new.jpg",
  "coop": "https://supermarkets.s3.eu-central-1.amazonaws.com/coop_new.gif",
  "shufersal": "https://supermarkets.s3.eu-central-1.amazonaws.com/shufersal_new.gif",
  "doralon": "https://supermarkets.s3.eu-central-1.amazonaws.com/doralon_new.gif",
  "superpharm": "",
  "victory": "https://supermarkets.s3.eu-central-1.amazonaws.com/victory_new.gif",
  "mahsaneihashuk": "https://supermarkets.s3.eu-central-1.amazonaws.com/mahsneishuk_new.gif",
  "mahsaneilahav": "https://supermarkets.s3.eu-central-1.amazonaws.com/mahsanei-lahav.jpg",
  "osherad": "https://supermarkets.s3.eu-central-1.amazonaws.com/osherad_new.gif",
  "mega": "https://supermarkets.s3.eu-central-1.amazonaws.com/mega_new.gif",
  "hazihinam": "https://supermarkets.s3.eu-central-1.amazonaws.com/hazihinam_new.gif",
  "keshettaamim": "https://supermarkets.s3.eu-central-1.amazonaws.com/keshettaamim_new.gif",
  "ramilevy": "https://supermarkets.s3.eu-central-1.amazonaws.com/ramilevy_new.gif",
  "superdush": "https://supermarkets.s3.eu-central-1.amazonaws.com/superdush_new.gif",
  "yohananof": "https://supermarkets.s3.eu-central-1.amazonaws.com/yohananov_new.gif",
  "ybitan": "https://supermarkets.s3.eu-central-1.amazonaws.com/ybitan_new.gif",
  "freshmarket": "https://supermarkets.s3.eu-central-1.amazonaws.com/freshmarket_new.gif",
  "zolvebegadol": "https://supermarkets.s3.eu-central-1.amazonaws.com/zolbegadol_new.gif",
  "stopmarket": "https://supermarkets.s3.eu-central-1.amazonaws.com/stopmarket.jpg",
  "salahdabah": "",
  "kingstore": "https://supermarkets.s3.eu-central-1.amazonaws.com/kingstore_new.gif",
  "bareket": "https://supermarkets.s3.eu-central-1.amazonaws.com/superbareket_new.jpg",
  "newpharm": "",
  "shukhair": "",
  "edenteva": "https://supermarkets.s3.eu-central-1.amazonaws.com/edenteva_new.gif",
  "barkol": "https://supermarkets.s3.eu-central-1.amazonaws.com/barkol_new.gif",
}


async function convertAddrees2Point(req) {
    console.log( req.params["full_address"])
    var point = "Israel," + ","+ req.params["full_address"]
    
    try{
      const results =  await geocoder.geocode( point) ;
      console.log(results);
      
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

function geo_location(location){
  console.log("Geo Location " + location)
  if(location == undefined){
    return {};
  }

  return  {
    "longitude": location.get("longitude"),
    "latitude": location.get("latitude"),
  };
}

function getDistance2Point(point, location){
  if(point && Object.keys(point).length == 0){
    return 0;
  }else{
    return geolib.getDistance(point, geo_location(location), accuracy = 1);
  }
}

function to_flutterflow(stores, point = {}, locations = []){  
  let stores_array = [];
  stores_array =  stores.map( store => {  
    //console.log("Store -- " + JSON.stringify(store) + " - - - " + store.get("name"))    
    
    if(locations.length > 0){
      var location = locations.find(loc => { return loc.id === store.get('location_id').toString() })
    } else {
      var location = store.related('location');
    }
    console.log("Location -- " + JSON.stringify(location) )
    
    var chain = store.related('chain')
    //console.log("chain -- " + JSON.stringify(chain) )
    
    var rStore = {
      "id": store.get("id"),
      "chain": chain.get("description"),
      "name": store.get("name"),
      "city": location.get("city"),
      "address": location.get("address"),
      "chain_img": store_img[chain.get("name")],
      "discounts_no":  Math.round((Math.random() * (250 - 75) + 75)),
      "location": geo_location(location),
      "distance_in_metr": getDistance2Point(point, location),
    }
    console.log("rStore -- " + JSON.stringify(rStore))
    return rStore; 
  })  

  return {"supermarkets": stores_array}
}

//  http://localhost:3001/flutterflow/supermarkets/""
router.get("/supermarkets/:store_ids", cors(), async function (req, res, next) {
    try{
      console.log( req.params["store_ids"])
      const store = new Store();      
        store.load_stores(req.params["store_ids"], (stores)=>{
          res.status(201).json(to_flutterflow(stores));
      });     
    } catch(err){
      res.status(201).json({ error: err.message || err.toString() });
    }
});

//  http://localhost:3001/flutterflow/supermarkets/search/פתח תקווה משה סנה 32
router.get("/supermarkets/search/:full_address", async function (req, res, next) {
  try{
    var point = await convertAddrees2Point(req);
    console.log("Point: " + JSON.stringify(point));
    const location = new Location();       
    location.byPoint(point, (near_locations) => {
      console.log("Near " + near_locations.length);
      
      const store = new Store();      
      store.nearby(near_locations, (stores)=>{
        res.status(201).json(to_flutterflow(stores, point, near_locations));
      });
    });
  } catch(err){
    res.status(201).json({ error: err.message || err.toString() });
  }
});

//http://localhost:3001/flutterflow/superproducts/1-2-3-4/100
router.get("/superproducts/:supermarkets/:category", function (req, res, next) {
    res.status(201).json( req.params["supermarkets"], req.params["category"]);
});


module.exports = router;
