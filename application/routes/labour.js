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
			typeof req.body.Service_Time != 'object' || 
			typeof req.body.Gender == 'undefined' || 
			typeof req.body.DOB == 'undefined' ||
			typeof req.body.Address == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if(typeof req.body.Service_Time.From == 'undefined' ||
			typeof req.body.Service_Time.To == 'undefined'){
			res.json(common.getResponses('MNS026', {}));
			return;
		}

		if(typeof req.body._id == 'undefined' && typeof req.body.Mobile_Number == 'undefined'){
			res.json(common.getResponses('MNS022', {}));
			return;				
		}else{
			if(req.body._id == '' && typeof req.body.Mobile_Number == 'undefined'){
				res.json(common.getResponses('MNS022', {}));
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
			Address: req.body.Address,
			Gender: req.body.Gender,
			DOB: req.body.DOB,		
			User_Type: common.getUserType(2)
		};
		self.db.get('user', {_id: typeof req.body._id == 'string' ? req.body._id : ''}, labour => {
			var response = common.getResponses('MNS001', {});
			if(labour.length == 0){
				newUser._id = common.getMongoObjectId();
				newUser.Mobile_Number = "" + req.body.Mobile_Number;					
			    User.checkUserExist(newUser.Mobile_Number, (isExist, usr) => {
			    	if(!isExist){
			    		self.db.insert('user', newUser, (err, result) => {
							response.data = {insert_id: newUser._id};
					    	res.json(response);
					    });
			    	}else
			    		res.json(common.getResponses('MNS016', {}));
			    });
			}else{
				response = common.getResponses('MNS002', {});
				self.db.update('user', {_id: req.body._id}, newUser, (err, result) => {
					res.json(response);
				});
			}
		});
	};
}

module.exports = Labour;