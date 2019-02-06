var ObjectId = require('mongodb').ObjectId;

function Labour(db) {
	var self = this;
	self.db = db;
	this.executeUpdate = function(req, res) {

		if(typeof req.body.Mobile_Number == 'undefined' || 
			typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined'
			typeof req.body.Locality_ID == 'undefined'
			typeof req.body.Service_Type_ID == 'undefined'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		var newUser = {
			First_Name: req.body.First_Name,
			Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
			Mobile_Number: req.body.Mobile_Number,
			Email_Id: req.body.Mobile_Number,
			Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
					req.body.Alternate_Mobile_Number : '',					
			User_Type: 3
		};
	};
}

module.exports = Labour;