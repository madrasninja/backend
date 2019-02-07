var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');

const Booking = function() {	
	var self = this;
	self.db = config.db;
	config.setSMTPConfig((smtp) => {
		this.smtp = smtp;
	});
	this.onBooking = function(req, res){
		
	};	
	this.createCustomer = function(user, cb){
		self.db.insert('user', user, (err, result) => {
	    	cb(result.insertedId);
	    });
	};
	this.onSubmitBooking = function(req, res){

		if(typeof req.body.Mobile_Number == 'undefined' || 
			typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined' ||
			typeof req.body.Locality_ID == 'undefined' ||
			typeof req.body.Service_Type_ID == 'undefined' ||
			typeof req.body.Address == 'undefined' ||
			typeof req.body.Session_Time != 'object'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		if(typeof req.body.Session_Time.From == 'undefined' ||
			typeof req.body.Session_Time.To == 'undefined'){
			res.json({response: 'error', message: 'Session Time From & To is Required'});
			return;
		}

		var afterUserFetched = (User_ID) => {

			var insertData = {
				User_ID: User_ID,
				Locality_ID: req.body.Locality_ID,
				Service_Type_ID: req.body.Service_Type_ID,
				Address: req.body.Address,
				Status_ID: '0',
				Payment_Status: 0,
				Payment_Details: {},
				Labour_ID: [],
				Session_Time: req.body.Session_Time
			};
			insertData = JSON.parse(JSON.stringify(insertData));
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
				self.createCustomer(newUser, afterUserFetched);
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
		var UPD = {Payment_Status: Payment_Status};
		if(typeof req.body.Payment_Details !='undefined')
				UPD.Payment_Details = req.body.Payment_Details;
		self.db.update('booking', {_id: new ObjectId(req.body.Booking_ID)}, UPD, (err, result) => {
			var message = 'Invalid Booking ID';
			var response = 'error';
			if(Payment_Status == 1 && parseInt(result.result.nModified) === 1){
				message = 'Payment SuccessFull';
				response = 'success';
				self.sendEmailToAdmin();
			}
			else if(Payment_Status == 2)
				message = 'Payment Cancelled';
			else if(Payment_Status == 3)
				message = 'Payment Failed';
			res.json({response: response, message: message, result: result});
		});
	};	
	this.sendEmailToAdmin = function(){
		self.db.get('settings', {}, (settings) => {
			var title = settings.length > 0 ? settings[0].title : '';
			var adminMail = settings.length > 0 ?
				settings[0].smtp_config.auth.user : config.smtp_config.auth.user;
			self.smtp.getFile({title: title}, (d) => {
				var mail = {
				    from: adminMail,
				    to: "karthisg.sg@gmail.com",
				    subject: "New Booking Service",
				    html: d.html
				};
				self.smtp.sendMail(mail, (err, res) => {
					if (err) {console.log(err);}
				});
			});
		});
	};
};

 module.exports = Booking;