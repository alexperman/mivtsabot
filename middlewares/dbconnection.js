var jsonColumns = require('bookshelf-json-columns');

var method = dbconnection.prototype

function dbconnection(){  
	this.knex = require('knex')({
      client: 'pg',
      //connection: process.env.DATABASE_URL,
      // for local testing
      connection: {host: "localhost", user: "postgres", password: "postgres", database: "discountshub_development" },
      ssl: true 
      });

  this.bookshelf = require('bookshelf')(this.knex);
  this.bookshelf.plugin(jsonColumns);
}

module.exports = dbconnection;