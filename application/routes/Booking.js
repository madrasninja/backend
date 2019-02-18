var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');

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
				ID: 'MNS' + common.uniqueid(),
				User_ID: User_ID,
				Locality_ID: req.body.Locality_ID,
				Service_Type_ID: req.body.Service_Type_ID,
				Address: req.body.Address,
				Status_ID: 0,
				Payment_Status: 0,
				Payment_Details: {},
				Labour_ID: [],
				Session_Time: req.body.Session_Time
			};
			insertData = JSON.parse(JSON.stringify(insertData));
			self.db.insert('booking', insertData, (err, result) => {
				if(result.insertedCount == 1){
					self.sendEmailToUser(insertData.ID, req.body.Email_Id);
					res.json({
						response: 'success',
						message: 'Booking Data\'s Saved and Idle For Payment Response',
						Booking_ID: insertData.ID
					});
				}
				else
					res.json({response: 'error', message: 'Data\'s Missing'});
			});
		};

		self.db.get('user', {Mobile_Number: req.body.Mobile_Number}, user => {
			if(user.length == 0){
				var newUser = {
					_id: common.getMongoObjectId(),
					First_Name: req.body.First_Name,
					Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
					Mobile_Number: req.body.Mobile_Number,
					Email_Id: req.body.Email_Id,
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
		var UPD = {Payment_Status: Payment_Status, Status_ID: 1};
		if(typeof req.body.Payment_Details !='undefined')
				UPD.Payment_Details = req.body.Payment_Details;
		self.db.update('booking', {ID: req.body.Booking_ID}, UPD, (err, result) => {
			var message = 'Invalid Booking ID';
			var response = 'error';
			if(Payment_Status == 1 && parseInt(result.result.nModified) === 1){
				message = 'Payment SuccessFull';
				response = 'success';
				/*self.sendEmailToUser(req.body.Booking_ID);*/
			}
			else if(Payment_Status == 2)
				message = 'Payment Cancelled';
			else if(Payment_Status == 3)
				message = 'Payment Failed';
			res.json({response: response, message: message, result: result});
		});
	};	
	this.sendEmailToUser = function(BID, UEmail){

		var hitSend = (settings, TO, isAdmin) => {
			var title = settings.length > 0 ? settings[0].title : '';
			var adminMail = settings.length > 0 ?
				settings[0].smtp_config.auth.user : config.smtp_config.auth.user;
			var content = isAdmin ? '<h3>Customer needs a ninja</h3>' : '<h3>Your order has been placed</h3>';
			content += '<h1>Booking ID: ' + BID + '</h1><br>';
			content += isAdmin ? '<p>Click here to assign a ninja for the above booking</p>' : '<p>You will get the further details shortly</p>'; 
			content += '<p>Thanks</p><p>Madras Ninja Bot</p>';
			self.smtp.getFile({title: title, content: content}, (d) => {
				var mail = {
				    from: adminMail,
				    to: TO,
				    subject: isAdmin ? "New Service Request" : "Madras Ninja - New Service Request",
				    html: d.html
				};
				self.smtp.sendMail(mail, (err, res) => {
					if (err) {console.log(err);}
				});
			});
		};

		self.db.get('settings', {}, (settings) => {
			self.getAdmins((emailIDS) => {
				hitSend(settings, emailIDS, true);
			});
			hitSend(settings, UEmail, false);
		});

	};
	this.getAdmins = function(cb){
		var cond = {
			$or: [
				{User_Type: 0},
				{User_Type: 1}
			]
		};
		var emailIDS = [];
		self.db.get('user', cond, (user) => {
			if(user.length > 0){
				user.forEach((u,  ind) => {
					emailIDS.push(u.Email_Id);
				});
			}
			cb(emailIDS);
		});
	};

	this.getBookingList = function(req, res){
		var lookups = [
			{
				$lookup: {
					from: 'user',
					localField: 'User_ID',
					foreignField: '_id',
					as: 'user'
				}
			},
			{
				$lookup: {
					from: 'locality',
					localField: 'Locality_ID',
					foreignField: '_id',
					as: 'locality'
				}
			},
			{
				$lookup: {
					from: 'service_type',
					localField: 'Service_Type_ID',
					foreignField: '_id',
					as: 'service_type'
				}
			},
			{
				$lookup: {
					from: 'status',
					localField: 'Status_ID',
					foreignField: '_id',
					as: 'status'
				}
			},
			{
				$replaceRoot: {
			        newRoot: {
			            $mergeObjects: [		            	
			            	"$$ROOT",
			            	{user: { $arrayElemAt: [ "$user", 0 ] }},
			            	{locality: { $arrayElemAt: [ "$locality", 0 ] }},
			            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }},
			            	{status: { $arrayElemAt: [ "$status", 0 ] }}
			            ],
			        }
			    }
		    }
		];
		if(typeof req.params.offset !== 'undefined'){
			lookups.push({ $limit: 10});
			lookups.push({ $skip: parseInt(req.params.offset)});
		}
		self.db.connect((db) => {
			db.collection('booking').aggregate(lookups, (err, data) => {
				var c1 = c2 = 0;				
				data.forEach((d, k) => {
					if(d.Status_ID == 2 || d.Labour_ID.length > 0)
						c1++;
				});
				data.forEach((d, k) => {
					if(d.Status_ID == 2 || d.Labour_ID.length > 0){						
						self.db.get('user', {_id: {$in: d.Labour_ID}, User_Type: 2}, (lab) => {
							c2++;
							data[k].Labours = lab;
							if(c1 == c2)
								res.json(data);
						});
					}
				});				
		  	});
		});
	};
	this.getLabourForBooking = function(req, res){
		self.db.get('booking', {ID: req.params.BID}, data => {
			if(data.length > 0){
				var reqFrom = data[0].Session_Time.From.split(' ')[1];
				var reqTo = data[0].Session_Time.To.split(' ')[1];
				var lookups = [
					{
						$lookup: {
							from: 'locality',
							localField: 'Locality_ID',
							foreignField: '_id',
							as: 'locality'
						}
					},
					{
						$lookup: {
							from: 'service_type',
							localField: 'Service_Type_ID',
							foreignField: '_id',
							as: 'service_type'
						}
					},
					{
						$replaceRoot: {
					        newRoot: {
					            $mergeObjects: [		            	
					            	"$$ROOT",
					            	{locality: { $arrayElemAt: [ "$locality", 0 ] }},
					            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }}
					            ],			            
					        }
					    }
				    },
					{
						$match: {
							$and: [
								{Service_Type_ID: data[0].Service_Type_ID},
								{Locality_ID: data[0].Locality_ID},
								{User_Type: 2},
								{'Service_Time.From': { $lte: reqFrom}},
								{'Service_Time.To': { $gte: reqTo}}
							]
						}
					}
				];
				if(typeof req.params.offset !== 'undefined'){
					lookups.push({ $limit: 10});
					lookups.push({ $skip: parseInt(req.params.offset)});
				}
				self.db.connect((db) => {
					db.collection('user').aggregate(lookups, (err, labour) => {
						res.json(labour);
				  	});
				});
			}else
				res.json({response: 'error', message: 'Booking Not Found'});
		});
	};//9:30 < 14:00 && 18:30 > 15:00
	this.AssignLabour = function(req, res){
		if(typeof req.body.Booking_ID == 'undefined' ||
			typeof req.body.Labour_ID == 'undefined'){
			res.json({response: 'error', message: 'Data\'s Missing'});
			return;
		}
		var Labour_ID = typeof req.body.Labour_ID == 'string' ? 
			[req.body.Labour_ID] : req.body.Labour_ID;
		var UPD = {Labour_ID: Labour_ID, Status_ID: 2};
		self.db.update('booking', {ID: req.body.Booking_ID}, UPD, (err, result) => {
			res.json({response: 'success', message: 'Labour Assigned SuccessFull'});
		});
	};
};

 module.exports = Booking;