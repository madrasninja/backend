
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = true ? 'mongodb://karthisgk:sgk97sgk@api.madrasninja.com:27017'
: 'mongodb://localhost';
const dbName = 'madrasninja';
var collection = require('./collections.js');

function DB(){
	this.connect = function(cb){
		MongoClient.connect(url, function(err, client) {
		  	assert.equal(null, err);
		  	const db = client.db(dbName);		  	
		  	cb(db);
		  	client.close();
		});
	};
}

DB.prototype.insert = function(tbName, data, cb) {
	this.connect(function(db){
		if(typeof data.length === "undefined"){
			db.collection(tbName).insertOne(data, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(2, r.insertedCount);
	      		}
      			cb(err, r);
			});
		}else{
			if(data.length <= 0){
				cb('Empty data', {});
				return;
			}
			db.collection(tbName).insertMany(data, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(2, r.insertedCount);
	      		}
      			cb(err, r);
			});
		}
	});
};

DB.prototype.update = function(tbName, wh, data, cb){
	this.connect(function(db){
		if(typeof data.length === "undefined"){
			db.collection(tbName).updateOne(wh, {$set: data}, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(1, r.matchedCount);
	      			assert.equal(1, r.modifiedCount);
	      		}
      			cb(err, r);
			});
		}else{
			if(data.length <= 0){
				cb('Empty data', {});
				return;
			}
			db.collection(tbName).updateMany(wh, {$set: data}, function(err, r){
				if(err){
					assert.equal(null, err);
	      			assert.equal(1, r.matchedCount);
	      			assert.equal(1, r.modifiedCount);
	      		}
      			cb(err, r);
			});
		}
	});
};

DB.prototype.get = function(tbName, wh, cb){
	this.connect(function(db){
		if(typeof wh.length === "undefined"){
			db.collection(tbName).find(wh).toArray((err, data) => {
				cb(data);
		  	});
		}
	});
};

DB.prototype.initDB = function(){/*create collection and insert initial records*/
	this.connect((dbs) => {
		dbs.command({dropDatabase: 1});
		this.connect((db) => {
			collection.createUserCollection(db, () => {
				collection.createBookingCollection(db, () => {
					collection.createStatusCollection(db, () => {
						collection.createServiceCollection(db, () => {
							collection.createLocalityCollection(db, () => {
								collection.initRecords(this);
								this.insert('settings', collection.settingsData,(err, r)=>{});
							});
						});
					});
				});
			});			
		});
	});
};

module.exports = DB;
