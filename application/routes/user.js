var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');

function User() {
	var self = this;
	self.db = config.db;
	this.checkUserExist = function(MN, cb) {
		self.db.get('user', {Mobile_Number: MN}, user => {
			cb(user.length > 0, user);
		});
	};
	this.getUser = function(req, res){
		var matchAnd = [];
		var lookups = [];
		if(typeof req.params.type !== 'undefined'){
			var UT = parseInt(req.params.type);
			matchAnd.push({User_Type: UT});
			if(UT == 2){
				lookups.push({
					$lookup: {
						from: 'service_type',
						localField: 'Service_Type_ID',
						foreignField: '_id',
						as: 'service_type'
					}
				});
				lookups.push({
					$lookup: {
						from: 'locality',
						localField: 'Locality_ID',
						foreignField: '_id',
						as: 'locality'
					}
				});
				lookups.push({
					$replaceRoot: {
				        newRoot: {
				            $mergeObjects: [		            	
				            	"$$ROOT",
				            	{locality: { $arrayElemAt: [ "$locality", 0 ] }},
				            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }}
				            ],			            
				        }
				    }
			    });
			}
		}
		if(typeof req.params.ID !== 'undefined')
			matchAnd.push({_id: req.params.ID});
		if(matchAnd.length > 0){
			lookups.push({
				$match: {
					$and: matchAnd
				}
			});
		}
		if(typeof req.query.offset !== 'undefined'){
			lookups.push({ $limit: 10});
			lookups.push({ $skip: parseInt(req.query.offset)});
		}
		self.db.connect((db) => {
			db.collection('user').aggregate(lookups, (err, user) => {
				res.json(user);
		  	});
		});
	};
}

module.exports = User;