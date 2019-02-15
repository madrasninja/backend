var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');
var User = require('./user.js');

function Labour() {
	var self = this;
	self.db = config.db;
	User = new User();
	this.executeUpdate = function(req, res) {

		if(typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined' ||
			typeof req.body.Locality_ID == 'undefined' ||
			typeof req.body.Service_Type_ID == 'undefined' ||
			typeof req.body.Service_Time != 'object'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		if(typeof req.body.Service_Time.From == 'undefined' ||
			typeof req.body.Service_Time.To == 'undefined'){
			res.json({response: 'error', message: 'Service Time From & To is Required'});
			return;
		}

		if(typeof req.body._id == 'undefined' && typeof req.body.Mobile_Number == 'undefined'){
			res.json({response: 'error', message: 'Mobile Number\'s Required'});
			return;				
		}else{
			if(req.body._id == '' && typeof req.body.Mobile_Number == 'undefined'){
				res.json({response: 'error', message: 'Mobile Number\'s Required'});
				return;
			}
		}


		var newUser = {
			First_Name: req.body.First_Name,
			Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
			Email_Id: req.body.Email_Id,
			Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
					req.body.Alternate_Mobile_Number : '',
			Locality_ID: req.body.Locality_ID,
			Service_Type_ID: req.body.Service_Type_ID,
			Service_Time: req.body.Service_Time,		
			User_Type: 2,
		};
		self.db.get('user', {_id: typeof req.body._id == 'string' ? req.body._id : ''}, labour => {
			var response = {response: 'success',message: 'Labour Data\'s Inserted'};
			if(labour.length == 0){
				newUser._id = common.getMongoObjectId();
				newUser.Mobile_Number = "" + req.body.Mobile_Number;					
			    User.checkUserExist(newUser.Mobile_Number, (isExist, usr) => {
			    	if(!isExist){
			    		self.db.insert('user', newUser, (err, result) => {
							response.insert_id = newUser._id;
					    	res.json(response);
					    });
			    	}else
			    		res.json({response: 'error', message: 'Mobile Number\'s Aleady Exist'});
			    });
			}else{
				response.message = 'Labour Data\'s Updated';
				self.db.update('user', {_id: req.body._id}, newUser, (err, result) => {
					res.json(response);
				});
			}
		});
	};
}

module.exports = Labour;