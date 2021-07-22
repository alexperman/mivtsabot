var express = require('express');
var router = express.Router();
var fs = require('fs');

var json = require('json-file');
var axios = require('axios');
var cheerio = require('cheerio');
const https = require('https');

//const admin = require('firebase');
//let serviceAccount = require("../serviceAccountKey.json");

//admin.initializeApp({
  //credential: admin.credential.cert(serviceAccount)
//});
//admin.database.enableLogging(true);



router.get('/', function (req, res, next) {
	res.render('homepage');
});

router.get('/chains', function(req, res, next){
	let db = admin.firestore();
		
	var chainsRef = db.collection('chains').doc("coop").set({ 
		name: "coop", 
		uid: "7290633800006", 
		description: "קואופ שופ​" 
	})
		/*
		superpharm: { name: "superpharm", uid: "7290172900007", description: "סופר פארם​" },
		hazihinam: { name: "hazihinam", uid: "7290700100008", description: "כל בו חצי חינם​" },
		superdush: { name: "superdush", uid: "7290873900009", description: "סופר דוש" },
		ybitan: { name: "ybitan", uid: "7290725900003", description: "יינות ביתן" },
		zolvebegadol: { name: "zolvebegadol", uid: "7290058140886", description: "זול ובגדול​" },
		salahdabah: { name: "salahdabah", uid: "729000000000", description: "סאלח דבאח ובניו" },
		kingstore: { name: "kingstore", uid: "7290058108879", description: "קינג סטור​" },
		newpharm: { name: "newpharm", uid: "7290307000008", description: "ניו פארם" },
		shukhair: { name: "shukhair", uid: "7290058148776", description: "שוק העיר" },
		edenteva: { name: "edenteva", uid: "7290908777774", description: "עדן טבע" },
		barkol: { name: "barkol", uid: "7290058160112", description: "בר כל רשתות בעמ" },
		shufersal: { name: "shufersal", uid: "7290027600007", description: "שופרסל" },
		yohananof: { name: "yohananof", uid: "7290803800003", description: "סופרשוק יוחננוף" },
		doralon: { name: "doralon", uid: "7290492000005", description: "דור אלון" },
		bareket: { name: "bareket", uid: "7290875100001", description: "עוף והודו ברקת" },
		mahsaneilahav: { name: "mahsaneilahav", uid: "7290058179503", description: "מחסני להב" },
		stopmarket: { name: "stopmarket", uid: "7290639000004", description: "סטופמרקט" },
		mega: { name: "mega", uid: "7290055700007", description: "מגה קמעונות בעמ​" },
		mahsaneihashuk: { name: "mahsaneihashuk", uid: "7290661400001", description: "מחסני השוק" },
		ramilevy: { name: "ramilevy", uid: "7290058140886", description: "רמי לוי  שיווק השקמה" },
		victory: { name: "victory", uid: "7290696200003", description: "ויקטורי" },
		freshmarket: { name: "freshmarket", uid: "7290876100000", description: "פרשמרקט" },
		keshettaamim: { name: "keshettaamim", uid: "7290785400000", description: "קשת טעמים" },
		osherad: { name: "osherad", uid: "7290103152017", description: "אושר עד" },
		tivtam: { name: "tivtam", uid: "7290873255550", description: "טיב טעם" }
	});*/

	res.json("okay")
})


router.get('/parse', function (req, res, next) {
	var catalog = new json.File(appRoot + "/catalog/catalog/index.json");
	catalog.readSync();

	for (var i = 0; i < catalog.data.length; i++) {
		category = catalog.data[i]
		dir = appRoot + "/catalog/catalog/" + category["category"].toString().replace(/["'`/]/g, '');
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		fs.writeFileSync(dir + '/index.json', JSON.stringify(category["subcategories"]))
		console.log("\t => " + category["category"]);

		for (var j = 0; j < category["subcategories"].length; j++) {
			var subcategory = category["subcategories"][j];
			sbdir = dir + "/" + subcategory["name"].toString().replace(/["'`/]/g, '');
			if (!fs.existsSync(sbdir)) {
				fs.mkdirSync(sbdir);
			}

			fs.writeFileSync(sbdir + '/index.json', JSON.stringify(subcategory["productlists"]))
			console.log("\t\t ==> " + subcategory["name"]);

			for (var k = 0; k < subcategory["productlists"].length; k++) {
				var productlist = subcategory["productlists"][k];
				var pldir = sbdir + "/" + productlist["name"].toString().replace(/["'`/]/g, '');
				if (!fs.existsSync(pldir)) {
					fs.mkdirSync(pldir);
				}

				fs.writeFileSync(pldir + '/index.json', JSON.stringify(productlist["products"]))
				console.log("\t\t\t ===> " + productlist["name"]);
			}
		}
	}

	res.json("okay")
})

router.get('/products', function (req, res, next) {
	var catalog = new json.File(appRoot + "/catalog/catalog/index.json");
	catalog.readSync();	
	
	(function categoriesLoop(i) {
		setTimeout(function () {
			var category = catalog.data[i-1];
			var dir = appRoot + "/catalog/catalog/" + category["category"].toString().replace(/["'`/]/g, '');		

			(function subcategoriesLoop(j) { 
				setTimeout(function () { 		
					var subcategory = category["subcategories"][j-1];
					sbdir = dir + "/" + subcategory["name"].toString().replace(/["'`/]/g, '');

					(function productlistsLoop(k) {          
						setTimeout(function () {   
							var productlist = subcategory["productlists"][k-1];
							var pldir = sbdir + "/" + productlist["name"].toString().replace(/["'`/]/g, '');
							scrapProducts(productlist, pldir)
							
							if (--k) productlistsLoop(k);      //  decrement i and call myLoop again if i > 0
						}, 3000)
					})(subcategory["productlists"].length);
					
					if(--j) subcategoriesLoop(j)
				}, 20000)
			})(category["subcategories"].length);
			
			if(--i) categoriesLoop(i)
		}, 60000)
	})(catalog.data.length);
	
	res.json("okay");
});


module.exports = router;


scrapProducts = function(productlist, pldir){
	var products = []
	var promises = []
	for(var i = 0; i<12; i++){
		if(i == 0){
			var url =  productlist["url"];	
		} else {
			var url =  productlist["url"] + "/fragment?q=:relevance&page=" + i;	
		}
		
		promises.push( axios.get(url, {
				httpsAgent: new https.Agent({
					rejectUnauthorized: false
				})
			})
		)
	}

	axios.all(promises).then((results)=>{
		results.forEach(response => {
			var $ = cheerio.load(response.data)
			var matches = $("#mainProductGrid li[data-product-code]");			
			
			if(matches.length > 0){ 
				matches.each(function (i, elem) {									
					products.push({
						"name": $(this).attr("data-product-name"),
						"image": $(this).find('img').attr('src') ,
						"code": $(this).attr("data-product-code")
					});
				});
			}
		});
		console.log("\t ==> Products " + products.length + " from page " + pldir )
		if (fs.existsSync(pldir)) {
			//fs.mkdirSync(pldir);
			fs.writeFileSync(pldir + '/index.json', JSON.stringify(products))
		}
	})
	.catch(error => {
		console.log(error);
	})
}