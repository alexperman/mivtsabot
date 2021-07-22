var express = require("express");
var router = express.Router();
const fs = require("fs");
const axios = require("axios");



var ProductsCatalog = require('../middlewares/productscatalog');
var productscatalog = new ProductsCatalog("mivtsaim", "us-west1", "./mivtsaim.json");


// Plan
// 1. obtain the path to the json file
// 2. read json files and parse the content
// 3. create pipe for the images from the super storage to Google storage
// 4. create a csv file with the list of the images

//http://localhost:3001/catalog
router.get("/", function (req, res, next) {
  productscatalog.listProductSets((productSets)=>{
    //res.json(productSets);
    res.render('catalog/productsets',{productsets: productSets});
  });  
});

//http://localhost:3001/catalog/productssets
router.get("/productssets", function (req, res, next) {
  productscatalog.listProductSets((productsets)=>{
    res.json(productsets);
  });  
});

//http://localhost:3001/catalog/products/?productsset=78-10865
router.get("/products", function (req, res, next) {
  let productsset = req.query.productsset;
  productscatalog.listProducts(productsset,(products)=>{
    res.json(products);
  }).catch(error => {
    console.error(error);
  });  
});

//http://localhost:3001/catalog/images/upload/?chain=hazihinam&filename=%D7%9E%D7%95%D7%A6%D7%A8%D7%99%20%D7%97%D7%9C%D7%91%20%D7%95%D7%91%D7%99%D7%A6%D7%99%D7%9D.json
router.get('/images/upload', function(req, res, next){
  let chain = req.query.chain;
  let filename = req.query.filename;
  
  let filepath = "C:/Users/alexander.perman/Desktop/" + chain + "/" + filename;
  jsonReader(filepath, (err, products) => {
    if (err) {
      console.log(err);
      return;
    }

    console.log("Received product : " + products.length); // => "Infinity Loop Drive"
    let uploaded = 0;
    var itemsProcessed = 0;
    products.forEach((product, index, array) => {
      productscatalog.uploadImage2GCS(product, (exists) => {
        itemsProcessed++;
        if(false == exists) {uploaded = uploaded + 1;}
        if(itemsProcessed === array.length) {
          res.send(`Received :${products.length} products , uploaded :${uploaded}`);
        }
      });
    });
  });  
})

//http://localhost:3001/catalog/images/list/
router.get('/images/list', function(req, res, next){
  productscatalog.listImagesPaginated((files)=>{
    var items = [];
    files.forEach(file => {
      items.push({"filename": file.metadata.id});
    });
    
    res.json(items);
  }).catch(console.error);
  ;
})

//http://localhost:3001/catalog/products/clean
router.get('/products/clean', function(req, res, next){
  productscatalog.cleanImageCatalog();
  res.send("Products catalog cleaned");
})

//http://localhost:3001/catalog/products/import
router.get('/products/import', function(req, res, next){
  productscatalog.importProductSets();
  res.send("Products catalog imported to Vision");
})


//http://localhost:3001/catalog/products/uploadcsv/?chain=hazihinam&filename=%D7%9E%D7%95%D7%A6%D7%A8%D7%99%20%D7%97%D7%9C%D7%91%20%D7%95%D7%91%D7%99%D7%A6%D7%99%D7%9D.json
router.get('/products/uploadcsv', function(req, res, next){
  let chain = req.query.chain;
  let filename = req.query.filename;
  
  let filepath = "C:/Users/alexander.perman/Desktop/" + chain + "/" + filename;
  jsonReader(filepath, (err, products) => {
    if (err) {
      console.log(err);
      return;
    }

    console.log("Received product : " + products.length); // => "Infinity Loop Drive"
    productscatalog.generateProductCSV(products, (status)=>{
      res.send(`Products catalog in CSV format uploaded${status ? "sucesfully" : "failed"}`);
    });
  });
});

function jsonReader(filePath, cb) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      let products = [];
      let alldata = JSON.parse(data);
      for (let i = 0; i < alldata.length; i++) {
        items = alldata[i].Results.Category.SubCategory.Items;
        for (let j = 0; j < items.length; j++) {
          products.push(items[j]);
        }
      }
      console.log(
        "Total number of products received from file : " + products.length
      );
      return cb && cb(null, products);
    } catch (err) {
      return cb && cb(err);
    }
  });
}

module.exports = router;
