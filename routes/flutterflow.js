var express = require("express");
var cors = require('cors')
var router = express.Router();
const fs = require("fs");
const axios = require("axios");
var geolib = require("geolib");

var NodeGeocoder = require('node-geocoder');



var options = {
  provider: 'google',
  httpAdapter: 'https', // Default
  apiKey: process.env.GOOGLE_API_KEY ,  // for Mapquest, OpenCage, Google Premier
  formatter: 'json',
  language: 'he',
  region: 'IL',
  minConfidence: 0.5,
  limit: 15
};

var geocoder = NodeGeocoder(options);


var admin = require("firebase-admin");
var serviceAccount = require("../mivtsaim-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();  

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


async function convertAddrees2Point(address) {   
    let point = "Israel," + ","+ address;    
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
  //console.log("Geo Location " + JSON.stringify(location));
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

function uniqueByLocation(array){
  let results = [];
  for(let i = 0; i < array.length; i++){
    let store = array[i];
    if(results.map(s=>JSON.stringify(s['location'])).indexOf(JSON.stringify(store['location'])) == -1){
      results.push(store)
    }
  }

  return results;
}

function to_flutterflow(stores, center = {}, store_ids = ""){  
  let stores_array = [];
  stores_array =  stores.map( store => {  
    let chain = store.related('chain')
    let location = store.related('location')
    
    var rStore = {
      "id": store.get("id"),
      "chain": chain.get("description"),
      "name": store.get("name"),
      "city": location.get("city"),
      "address": location.get("address"),
      "chain_img": store_img[chain.get("name")],
      "discounts_no":  Math.round((Math.random() * (250 - 75) + 75)),
      "location": geo_location(location),
      "distance_in_metr": getDistance2Point(center, location),
      "selected": store_ids.includes(store.get("id")),
    }
    console.log("\n rStore -- " + JSON.stringify(rStore) )
    return rStore;
  })  

  return {"supermarkets": uniqueByLocation(stores_array).sort((a, b) => a.distance_in_metr > b.distance_in_metr && 1 || -1)}
}

async function addMarkers2Firebase(stores) {  
  let markers = to_markers(stores)
  console.log("Markers :" + markers.length)
  if (markers.length > 0){    
    for(const marker of markers){
      console.log("Update marker : " + marker["store_id"])
      const storeMarkersRef = db.collection('store_locations').doc(marker["store_id"])
      const res = await storeMarkersRef.set(marker, {merge: true})
    }
  } 
}

function  to_markers(stores){
  let markers_arr = [];

  markers_arr =  stores.map( store => {  
    var location = store.related('location');
    console.log("Location ", JSON.stringify(location));
    if(location.get("longitude") == null || location.get("latitude") == null) { return; }

    var marker = {
      "store_id": store.get("id"),
      "location":{
        "longitude": location.get("longitude"),
        "latitude": location.get("latitude"),
      }
    }
    console.log("Marker -- " + JSON.stringify(marker))
    return marker;
  })

  return markers_arr.filter(function (el) {
    return el != null;
  });
}

router.get("/markers", function (req, res) {
  try{
    const store = new Store();      
    store.markers((stores)=>{
      res.status(201).json(addMarkers2Firebase(stores));
    });     
  } catch(err){
    res.status(201).json({ error: err.message || err.toString() });
  }
})

//  http://localhost:3001/flutterflow/supermarkets/פתח תקווה משה סנה 32/"1,2,2"
router.get("/supermarkets/:address/:store_ids", cors(), async function (req, res, next) {
  try{
    console.log("\t Find in : " + req.params["address"])
    var point = await convertAddrees2Point(req.params["address"]);
    console.log("Point: " + JSON.stringify(point));

    const location = new Location();       
    location.byPoint(point, (near_locations) => {
      console.log("Near " + near_locations.length);
      
      const store = new Store();      
      store.nearby(near_locations, (stores)=>{
        res.status(201).json(to_flutterflow(stores, point,  req.params["store_ids"]));
      });
    });
  } catch(err){
    res.status(201).json({ error: err.message || err.toString() });
  }
});

module.exports = router;
