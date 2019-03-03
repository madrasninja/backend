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
	this.Signin = function(req, res){

		if(typeof req.body.email == 'undefined' ||
			typeof req.body.password == 'undefined'){
			res.json({result: 'error', message: 'Wrong Input'});
		}

		var cond = {
			$and: [				
				{$or: [
						{Email_Id: req.body.email},
						{Mobile_Number: req.body.email}
					]
				},
				{password: common.MD5(req.body.password)}
			]
		};
		self.db.get('user', cond, (data) => {
			if(data.length == 0){
				res.json({result: 'error', message: 'Invalid User'});
			}else{
				var token = common.gToken(30);				
				self.db.update('user', {_id: data[0]._id}, {accessToken: token}, (err, result) => {
					res.json({result: 'success', accessToken: token,
					message: 'Valid User', User_Type: data[0].User_Type});
				});
			}
		});
	};

	this.SignUp = function(req, res){
		if(typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined' ||
			typeof req.body.Mobile_Number == 'undefined' ||
			typeof req.body.password == 'undefined' || 
			typeof req.body.cpassword == 'undefined'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		if(req.body.password != req.body.cpassword){
			res.json({response: 'error', message: 'Confirm Password Mismatch!'});
			return;
		}

		var cond = {$or: [
				{Email_Id: req.body.Email_Id},
				{Mobile_Number: req.body.Mobile_Number}
			]};
		self.db.get('user', cond, (data) => {
			if(data.length > 0){
				if(data[0].Email_Id == req.body.Email_Id)
					res.json({response: 'error', message: 'Email Address Already Exist!'});
				else if(data[0].Mobile_Number == req.body.Mobile_Number)
					res.json({response: 'error', message: 'Mobile Number Already Exist!'});
				else
					res.json({response: 'error', message: 'Email or Mob Already Exist!'});
			}else{
				var newUser = {
					_id: common.getMongoObjectId(),
					First_Name: req.body.First_Name,
					Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
					Mobile_Number: req.body.Mobile_Number,
					Email_Id: req.body.Email_Id,
					password: common.MD5(req.body.password),
					Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
							req.body.Alternate_Mobile_Number : '',				
					User_Type: 3
				};
				self.db.insert('user', newUser, (err, result) => {
			    	res.json({response: 'success', message: 'User Created Successfull'});
			    });
			}
		});
	};
}

module.exports = User;