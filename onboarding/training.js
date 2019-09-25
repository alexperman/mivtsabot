var fs = require('fs');
var parse = require('csv-parse');
var request = require('request');
var dateFormat = require('dateformat');


function setEntityValues(){
  fs.createReadStream("./onboarding/street.csv")
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
      data_text = csvrow[0]        
      //do something with csvrow
      var req = {
        url: "https://api.wit.ai/entities/street/values",
        headers: { Authorization: 'Bearer 5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI',
                   'Content-Type': 'application/json'
                  },
        method: 'POST',
        json: {
          "value": data_text
        }
      }
      request(req, function (err, res, body) {})       
    })
    .on('end',function() {
      console.log("All values are updated for the entiry")
    });

}

function sendSamplesBatch(start, cb){
  var index = 1;
  var samples = []
  fs.createReadStream('./onboarding/street.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) { 
      if(index > start && index < (start+200)){
        data_text = csvrow[0]         
        console.log("\t ["+index+"] Text "+ dateFormat(Date.now(), "yyyy-mm-dd h:MM:ss") +" >>> " + data_text )
        samples.push({
          "text": data_text,
          "entities": [
            {
              "entity": "intent",
              "value": "location"
            },
            {
              "entity": "street",
              "value": data_text,
              "start": 0,
              "end": data_text.length
            }
          ]          
        })
      }
      index = index + 1;
    })
    .on('end',function() {
      var req = {
        url: 'https://api.wit.ai/samples?v=20170307',
        headers: { Authorization: 'Bearer 5X45AZF44P4Z7XSZFHUELXGTUYFEDLRI',
                   'Content-Type': 'application/json'
                  },
        method: 'POST',
        json: samples
      }
      console.log("\t Send request >>> from  [" + start + "] till " + (start + samples.length))
      request(req, function (err, res, body) {});

      if((index - start) > 0){
        console.log("\t The nextbatch in 1 min >>> ")  
        setTimeout(function(){      
          process_next_batch(start + 199)
        }, 70000);                             
      }
      cb;
    });
}

function process_next_batch(start){  
  sendSamplesBatch(start, ()=>{
    console.log("\t Start >>> " + start)
  });
}

function main(){
  setEntityValues();  
  process_next_batch(0);
}

main();
