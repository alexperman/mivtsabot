"use strict";

var EventEmitter = require('events');
var util = require('util');
const { Client } = require('pg')
var Store = require('../models/store');

// Build and instantiate our custom event emitter
function DbEventEmitter(){
  EventEmitter.call(this);
}

util.inherits(DbEventEmitter, EventEmitter);
var dbEventEmitter = new DbEventEmitter;

dbEventEmitter.on('store_products', (store_id) => {  
  updateProducts(store_id); 
});

dbEventEmitter.on('store_discounts', (store_id) => {
  updateDiscounts(store_id); 
});

dbEventEmitter.on('new_store', (store_id) => {
  updateStore(store_id); 
});

//----------------------------------------------------------------------------
// Firestore functions: get, save, create etc....

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();  

function updateProducts(store_id){
  console.log("Updating products for the store " + store_id);
  Store.where({id: store_id})
    .fetch()
    .then(function(store){  
      var products = JSON.parse(JSON.stringify(store.get('products_json')))
      console.log("Current store products is  " + products.lenght)   
      ensureStoreInFirebase(store, (store)=>{        
        addStoreProducts2Firebase(store, products)         
      })
    })
    .catch((err)=>{
      console.log("Get error " + err)
    })
}

function updateDiscounts(store_id){
   Store.where({id: store_id})
    .fetch()
    .then(function(store){
      var discounts = JSON.parse(JSON.stringify(store.get('discounts_json')))
      console.log("Current store discount count is " + discounts.lenght)
      ensureStoreInFirebase(store, (store)=>{        
        addStoreDiscounts2Firebase(store, discounts) 
      })
    })
    .catch((err)=>{
      console.log("Get error " + err)
    })
}

function updateStore(store_id){
  formatStore(store_id, (store)=>{
    addStore2Firebase(store, (res)=>{
      console.log("Store was added to db " + res);
    })
  })
}

function formatStore(store_id, cb){
   Store.where({id: store_id})
    .fetch({withRelated: ['chain', 'location']})
    .then(function(model){
      var store = JSON.parse(JSON.stringify(model))
      store["chain"] = {
        "name" : store["chain"]["name"],
        "description": store["chain"]["description"]
      }

      store["location"] = {
        "city" : store["location"]["city"],
        "zipcode": store["location"]["zipcode"],
        "latitude" : store["location"]["latitude"],
        "longitude" : store["location"]["longitude"],
        "address" : store["location"]["address"]
      }

      //var products = store["products_json"]
      //var discounts = store["discounts_json"]

      delete store["location_id"]
      delete store["chain_id"]
      delete store["products_json"] 
      delete store["discounts_json"]
      delete store["created_at"]
      delete store["updated_at"]

      console.log("Selected store from DB => " + JSON.stringify(store));
      cb(store);
  })
}

async function addStoreProducts2Firebase(store, products) {  
  console.log("Updating products :" + products.length)
  if (products.length > 0){
    const storeStoreRef = db.collection('stores').doc(store['id']);
    for(const product of products){
      console.log("Update product : " + product["code"])
      const storeProductsRef = storeStoreRef.collection('products').doc(product["code"])
      const res = await storeProductsRef.set(product, {merge: true})
    }
  } 
}

async function addStoreDiscounts2Firebase(store, discounts) {  
  console.log("Update discounts : "+discounts.length)
  if (discounts.length > 0){
    const storeStoreRef = db.collection('stores').doc(store['id']);
    for(const discount of discounts){
      console.log("Update discount : " + discount["promotion_id"])
      const storeDiscountsRef = storeStoreRef.collection('discounts').doc(discount["promotion_id"])
      const res = await storeDiscountsRef.set(discount, {merge: true})
    }
  } 
}

async function addStore2Firebase(store, cb) {
  const res = await db.collection('stores').doc(store['id']).set(store);
  cb(res);
}

async function ensureStoreInFirebase(store, cb){
  const storesRef = db.collection('stores').doc(store['id']);  
  const doc = await storesRef.get();
  if (!doc.exists) {
    formatStore(store['id'], (store)=>{
      addStore2Firebase(store, (res)=>{
        console.log("Store was added to db " + res);
        cb(store);
      })
    })
  } else {
    console.log('Document data:', doc.data());
    cb(store)
  }
}


class FirebaseAdmin {
    constructor() {
			this._client = new Client({connectionString: 'postgres://postgres:postgres@localhost:5432/discountshub_development'});
      this._client.connect();			
    }
   
    initListeners() {
      this._client.on('notification', function(msg) {				
				dbEventEmitter.emit(msg.channel, msg.payload);
			});
			this._client.query('LISTEN store_products');
      this._client.query('LISTEN store_discounts');
      this._client.query('LISTEN new_store');
      console.log("Listeners are initialised !!!")
    }
  }
  
  module.exports = FirebaseAdmin;



