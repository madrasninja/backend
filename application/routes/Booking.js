
const Booking = function(db) {
	var self = this;
	self.db = db;
	this.onBooking = function(req, res){
		var rtrn = {};
		self.db.get('locality', {}, locality => {
			rtrn.locality = locality;
			self.db.get('service_type', {}, service_type => {
				rtrn.service_type = service_type;
				res.json(rtrn);
			});
		});
	};
	this.createCustomer = function(user, cb){
		self.db.insert('user', user, (err, result) => {
	    	cb(result.insertedId);
	    });
	};
	this.onSubmitBooking = function(req, res){

		if(typeof req.body.Mobile_Number == 'undefined' || 
			typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		var afterUserFetched = (User_ID) => {
			req.body.Status_ID = 0;
			req.body.Payment_Status = 0;
			var insertData = {
				User_ID: User_ID,
				Locality_ID: req.body.Locality_ID,
				Service_Type_ID: req.body.Service_Type_ID,
				Address: typeof req.body.Address != 'undefined' ? req.body.Address : '',
				Status_ID: 0,
				Payment_Status: 0,
				Labour_ID: [],
				Session_Time: req.body.Session_Time
			};
			if(typeof req.body.Payment_Details !='undefined')
				insertData.Payment_Details = req.body.Payment_Details;
			self.db.insert('booking', insertData, (err, result) => {
				if(result.insertedCount == 1){
					res.json({
						response: 'success',
						message: 'Booking Data\'s Saved and Idle For Payment Response',
						Booking_ID: result.insertedId
					});
				}
				else
					res.json({response: 'error', message: 'Data\'s Missing'});
			});
		};

		self.db.get('user', {Mobile_Number: req.body.Mobile_Number}, user => {
			if(user.length == 0){
				var newUser = {
					First_Name: req.body.First_Name,
					Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
					Mobile_Number: req.body.Mobile_Number,
					Email_Id: req.body.Mobile_Number,
					Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
							req.body.Alternate_Mobile_Number : '',					
					User_Type: 3
				};
				this.createCustomer(newUser, afterUserFetched);
			}else
				afterUserFetched(user[0]._id);
		});
	};
	this.onPaymentFinished = function(req, res) {
		if(typeof req.body.Booking_ID != 'string' || typeof req.body.Payment_Response != 'string'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}
		var Payment_Status = 0;
		if(req.body.Payment_Response == 'success')
			Payment_Status = 1;
		else if(req.body.Payment_Response == 'cancel')
			Payment_Status = 2;
		else if(req.body.Payment_Response == 'failed')
			Payment_Status = 3;
		self.db.update('booking', {_id: Booking_ID}, {Payment_Status: Payment_Status}, (err, result) => {
			res.json({response: 'success', message: 'Payment SuccessFull'});
		});
	};
};

 module.exports = Booking;