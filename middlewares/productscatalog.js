"use strict";

const axios = require("axios");
const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

class ProductsCatalog {
  constructor(projectId, location, keyFilename) {
    this._projectId = projectId;
    this._location = location;

    this._client = new vision.ProductSearchClient({
      projectId: projectId,
      keyFilename: keyFilename,
    });

    this._imageclient = new vision.ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: keyFilename,
    });

    this._storage = new Storage({
      projectId: projectId,
      keyFilename: keyFilename,
    });
    this._imagesBucket = this._storage.bucket("images-catalog");
  }

  uploadImage2GCS(product, cb) {
    //console.log("Uploading image " + product.ImgBig);
    let bucket_path = `hazihinam/${product.CategoryId}/${product.SubCategoryId}/${product.BarKod}.jpg`;
    const file = this._imagesBucket.file(bucket_path);

    file.exists().then(function (data) {
      var exists = data[0];
      console.log(`Image ${product.BarKod} exists: ${exists}`);

      if (exists == false) {
        axios({
          method: "GET",
          url: product.ImgBig,
          responseType: "stream",
        }).then((response) => {
          response.data
            .pipe(file.createWriteStream())
            .on("error", function (err) {
              console.log(err);
            })
            .on("finish", function () {
              console.log("File was sucessfully uploaded!!");
              cb(false);
            });
        });
      } else {
        cb(true);
      }
    });
  }

  generateProductCSV(products, cb) {
    let bucket_path = `images.csv`;
    const file = this._imagesBucket.file(bucket_path);

    const csvWriter = createCsvWriter({
      path: "images.csv",
      header: [
        { id: "image-uri", title: "image-uri" },
        { id: "image-id", title: "image-id" },
        { id: "product-set-id", title: "product-set-id" },
        { id: "product-id", title: "product-id" },
        { id: "product-category", title: "product-category" },
        { id: "product-display-name", title: "product-display-name" },
        { id: "labels", title: "labels" },
        { id: "bounding-poly", title: "bounding-poly"},
      ],
    });

    let csv_data = [];
    products.forEach(function (product, idx, array) {
      let bucket_path = `hazihinam/${product.CategoryId}/${product.SubCategoryId}/${product.BarKod}.jpg`;
      let setId = String(product.CategoryId).replace(/"|'/g, "") + "-" + String(product.SubCategoryId).replace(/"|'/g, "");
      let labels = `SKU=${String(product.BarKod).replace(/"|'/g,"")},SubCategoryName=${String(product.SubCategoryName).replace(/"|'|,/g,"")},CategoryName=${String(product.CategoryName).replace(/"|'|,/g,"")},chain=hazihinam`;

      csv_data.push({
        "image-uri": "gs://images-catalog/" + bucket_path,
        "image-id": `image-${product.BarKod}`,
        "product-set-id": setId,
        "product-id": `hazihinam-${product.BarKod}`,
        "product-category": "general-v1",
        "product-display-name": `${String(product.Name).replace(/"|'/g, "")}`,
        "labels": labels,
        "bounding-poly": "",
      });
      if (idx === array.length - 1) {
        csvWriter
          .writeRecords(csv_data)
          .then(() => {
            console.log("The CSV file was written successfully");
            
            fs.createReadStream('./images.csv')
              .pipe(file.createWriteStream())
              .on("error", function (err) {
                console.log(err);
                cb(false);
              })
              .on("finish", function () {
                console.log("CSV File was sucessfully uploaded!!");  
                cb(true);              
              });
          });
        console.log(`Last callback call at index ${idx} with value ${product}`);
      }
    });
  }

  async importProductSets() {
    const gcsUri = 'gs://images-catalog/images.csv';
  
    const projectLocation = this._client.locationPath(
      this._projectId,
      this._location
    );
    // Set the input configuration along with Google Cloud Storage URI
    const inputConfig = {
      gcsSource: {
        csvFileUri: gcsUri,
      },
    };
  
    // Import the product sets from the input URI.
    const [response, operation] = await this._client.importProductSets({
      parent: projectLocation,
      inputConfig: inputConfig,
    });
  
    console.log('Processing operation name: ', operation.name);
  
    // synchronous check of operation status
    const [result] = await response.promise();
    console.log('Processing done.');
    console.log('Results of the processing:');
  
    for (const i in result.statuses) {
      console.log(
        'Status of processing ',
        i,
        'of the csv:',
        result.statuses[i]
      );
  
      // Check the status of reference image
      if (result.statuses[i].code === 0) {
        console.log(result.referenceImages[i]);
      } else {
        console.log('No reference image.');
      }
    }
  }
  async getSimilarProductsFile() {
    /**
     * TODO(developer): Uncomment the following line before running the sample.
     */
    // const projectId = 'nodejs-docs-samples';
    // const location = 'us-west1';
    // const productSetId = 'indexed_product_set_id_for_testing';
    // const productCategory = 'apparel';
    // const filePath = './resources/shoes_1.jpg';
    // const filter = '';
    const productSetPath = productSearchClient.productSetPath(
      projectId,
      location,
      productSetId
    );
    const content = fs.readFileSync(filePath, 'base64');
    const request = {
      // The input image can be a GCS link or HTTPS link or Raw image bytes.
      // Example:
      // To use GCS link replace with below code
      // image: {source: {gcsImageUri: filePath}}
      // To use HTTP link replace with below code
      // image: {source: {imageUri: filePath}}
      image: {content: content},
      features: [{type: 'PRODUCT_SEARCH'}],
      imageContext: {
        productSearchParams: {
          productSet: productSetPath,
          productCategories: [productCategory],
          filter: filter,
        },
      },
    };
    const [response] = await imageAnnotatorClient.batchAnnotateImages({
      requests: [request],
    });
    console.log('Search Image:', filePath);
    const results = response['responses'][0]['productSearchResults']['results'];
    console.log('\nSimilar product information:');
    results.forEach(result => {
      console.log('Product id:', result['product'].name.split('/').pop(-1));
      console.log('Product display name:', result['product'].displayName);
      console.log('Product description:', result['product'].description);
      console.log('Product category:', result['product'].productCategory);
    });
  }

  // ---- List of all produsts and images
  async listImagesPaginated(cb) {
    const options = {
      prefix: 'hazihinam',
      delimeter: '/'
    };
    
    const [files] = await this._imagesBucket.getFiles(options);
    console.log(`Files: ${files.length}`);    
    cb(files);
  }  

  async listProducts(productsset, cb) {
    // Resource path that represents Google Cloud Platform location.
    const locationPath = this._client.locationPath(
      this._projectId,
      this._location
      ,productsset
    );
    
    const [products] = await this._client.listProducts({parent: locationPath});

    //const request = {
    //  name: productSetPath,
    //};
  
    //const [products] = await this._client.listProductsInProductSet(request);

    cb(products);
  }

  async listProductSets(cb) {
    // Resource path that represents Google Cloud Platform location.
    const locationPath = this._client.locationPath(
      this._projectId,
      this._location
    );

    const [productSets] = await this._client.listProductSets({
      parent: locationPath,
    });
    console.log("The number of product sets: " + productSets.length);
    cb(productSets);
  }

  // --- Deletion resources 
  async deleteProductSet(productSetId) {
    // Resource path that represents full path to the product set.
    const productSetPath = this._client.productSetPath(
      this._projectId,
      this._location,
      productSetId
    );

    await this._client.deleteProductSet({ name: productSetPath });
    console.log("Product set deleted.");
  }

  async purgeProductsInProductSet(productSetId) {
    // Deletes all products in a product set.
    const formattedParent = this._client.locationPath(
      this._projectId,
      this._location
    );
    const purgeConfig = { productSetId: productSetId };

    // The operation is irreversible and removes multiple products.
    // The user is required to pass in force=true to actually perform the purge.
    // If force is not set to True, the service raises an error.
    const force = true;
    try {
      const [operation] = await this._client.purgeProducts({
        parent: formattedParent,
        productSetPurgeConfig: purgeConfig,
        force: force,
      });
      await operation.promise();
      console.log("Products removed from product set.");
    } catch (err) {
      console.log(err);
    }
  }
  async cleanImageCatalog() {
    // Resource path that represents Google Cloud Platform location.
    const locationPath = this._client.locationPath(
      this._projectId,
      this._location
    );

    const [productSets] = await this._client.listProductSets({
      parent: locationPath,
    });
    this.purgeOrphanProducts().then(() => {
      console.log("The number of product sets: " + productSets.length);
      productSets.forEach((productSet) => {
        let productsetName = productSet.name.split("/").slice(-1);
        console.log(`Product Set name: ${productsetName}`);
        this.purgeProductsInProductSet(productsetName).then(() => {
          const productSetPath = this._client.productSetPath(
            this._projectId,
            this._location,
            productsetName
          );
          this._client.deleteProductSet({ name: productSetPath });
          console.log("Product set deleted.");
        });
      });
    });
  }

  async purgeOrphanProducts() {
    const formattedParent = this._client.locationPath(
      this._projectId,
      this._location
    );

    // The operation is irreversible and removes multiple products.
    // The user is required to pass in force=true to actually perform the purge.
    // If force is not set to True, the service raises an error.
    const force = true;
    try {
      const [operation] = await this._client.purgeProducts({
        parent: formattedParent,
        deleteOrphanProducts: true,
        force: force,
      });
      await operation.promise();
      console.log("Orphan products deleted.");
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = ProductsCatalog;
