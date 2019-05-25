var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');
var User = require('./user.js');
var crypto = require('crypto');

const Booking = function() {	
	var self = this;
	self.db = config.db;
	User = new User();
	config.setSMTPConfig((smtp) => {
		this.smtp = smtp;
	});
	self.isTriggerAutomation = true;
	setInterval(function(){

		if(!self.isTriggerAutomation)
			return;

		var $wh = {'Session_Time.From': {$lte: common.current_time()}};
		self.db.connect(function(newdb){
			newdb.collection('booking').updateMany($wh, {$set: {Status_ID: 4}}, (err, r) => {
				self.isTriggerAutomation = false;
			});
		});
	}, 100 * 100);
	/*to change booking date format
	self.db.get('booking', {}, book => {
		self.db.connect((newdb) => {
			book.forEach((sb, k)=>{
				var fm = sb.Session_Time.From + ":00";
				var fromTime = fm.split(' ')[1];
				fm = fm.split(' ')[0].split('/');
				sb.Session_Time.From = fm.length == 3 ? 
					fm[2] + '-' + fm[1] + '-' + fm[0] + ' ' + fromTime
					: fm.join('-') + ' ' + fromTime;

				var to = sb.Session_Time.To + ":00";
				var toTime = to.split(' ')[1];
				to = to.split(' ')[0].split('/');
				sb.Session_Time.To = to.length == 3 ? 
					to[2] + '-' + to[1] + '-' + to[0] + ' ' + toTime
					: to.join('-') + ' ' + toTime;
				newdb.collection('booking').updateOne({ID: sb.ID}, {$set: sb}, function(err, r){
					console.log(r);
				});
			});
		});
	});*/
	this.createCustomer = function(user, cb){
		self.db.insert('user', user, (err, result) => {
	    	cb(user);
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
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if(typeof req.body.Session_Time.From == 'undefined' ||
			typeof req.body.Session_Time.To == 'undefined'){
			res.json(common.getResponses('MNS018', {}));
			return;
		}

		if(req.body.Session_Time.From.split('/').length == 3){
			var sb = req.body.Session_Time;
			var fm = sb.From + ":00";
			var fromTime = fm.split(' ')[1];
			fm = fm.split(' ')[0].split('/');
			sb.From = fm.length == 3 ? 
				fm[2] + '-' + fm[1] + '-' + fm[0] + ' ' + fromTime
				: fm.join('-') + ' ' + fromTime;

			var to = sb.To + ":00";
			var toTime = to.split(' ')[1];
			to = to.split(' ')[0].split('/');
			sb.To = to.length == 3 ? 
				to[2] + '-' + to[1] + '-' + to[0] + ' ' + toTime
				: to.join('-') + ' ' + toTime;
			req.body.Session_Time = sb;
		}

		var afterUserFetched = (User) => {

			var insertData = {
				ID: 'MNS' + common.uniqueid(),
				User_ID: User._id,
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
					self.isTriggerAutomation = true;
					res.json(common.getResponses('MNS010', {Booking_ID: insertData.ID}));					
				}
				else
					res.json(common.getResponses('MNS019', {}));
			});
		};

		var condition = {$or: [
			{Email_Id: req.body.Email_Id},
			{Mobile_Number: req.body.Mobile_Number}
		]};
		self.db.get('user', condition, user => {
			if(user.length == 0){
				var newUser = {
					_id: common.getMongoObjectId(),
					First_Name: req.body.First_Name,
					Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
					Mobile_Number: req.body.Mobile_Number,
					Email_Id: req.body.Email_Id,
					Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
							req.body.Alternate_Mobile_Number : '',					
					User_Type: common.getUserType(3)
				};
				self.createCustomer(newUser, afterUserFetched);
			}else
				afterUserFetched(user[0]);
		});
	};
	this.getPaymentHash = function(req, res){

		if(typeof req.body.Booking_ID == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		var $wh = {ID: req.body.Booking_ID};
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
			            	{user: { $arrayElemAt: [ "$user", 0 ] }},
			            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }}
			            ]
			        }
			    }
		    },
			{ $match: $wh}
		];	

		self.db.connect((db) => {
			db.collection('booking').aggregate(lookups, (err, book) => {
				if(book.length > 0){
					book = book[0];

					var crypConfig = {
						key: config.PayUMoney.key,
						txnid: req.body.Booking_ID, 
						hash: '',
						amount: book.service_type.amount,
						firstname: book.user.First_Name,
						email: book.user.Email_Id,
						phone: book.user.Mobile_Number,
						productinfo: book.service_type.name,
						udf5: config.PayUMoney.udf5,
						surl : '/',
						furl: '/'
					};

					var cryp = crypto.createHash('sha512');
					var text = crypConfig.key+'|'+crypConfig.txnid+'|'
						+crypConfig.amount+'|'+crypConfig.productinfo+'|'+crypConfig.firstname+'|'
						+crypConfig.email+'|||||'+crypConfig.udf5+'||||||'
						+config.PayUMoney.salt;
					cryp.update(text);
					var hash = cryp.digest('hex');
					crypConfig.hash = hash;
					res.json(common.getResponses('MNS020', crypConfig));
				}else
					res.json(common.getResponses('MNS031', {}));
			});
		});	    
		
	};
	this.onPaymentSuccess = function(req, res){

		if(typeof req.body.Booking_ID == 'undefined' ||
			typeof req.body.Payment_Response == 'undefined' ||
			typeof req.body.mihpayid == 'undefined' ||
			typeof req.body.paymentResponseStatus == 'undefined' ||
			typeof req.body.respHash == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		var $wh = {ID: req.body.Booking_ID};
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
			            	{user: { $arrayElemAt: [ "$user", 0 ] }},
			            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }}
			            ]
			        }
			    }
		    },
			{ $match: $wh}
		];		

		var checkProcess = function(book) {
			var key = config.PayUMoney.key;
			var salt = config.PayUMoney.salt;
			var txnid = book.ID;
			var amount = book.service_type.amount;
			var email = book.user.Email_Id;
			var udf5 = config.PayUMoney.udf5;
			var mihpayid = req.body.mihpayid;
			var status = req.body.paymentResponseStatus;
			var resphash = req.body.respHash;
			var productInfo = book.service_type.name;
			var First_Name = book.user.First_Name;
			
			var keyString =	key+'|'+txnid+'|'+amount+'|'+productInfo+'|'+First_Name+'|'+email+'|||||'+udf5+'|||||';
			var keyArray = keyString.split('|');
			var reverseKeyArray	= keyArray.reverse();
			var reverseKeyString = salt+'|'+status+'|'+reverseKeyArray.join('|');
			
			var cryp = crypto.createHash('sha512');	
			cryp.update(reverseKeyString);
			var calchash = cryp.digest('hex');

			var details = {amount: amount, email: email,
			 mihpayid : mihpayid, status: status,resphash: resphash};
			
			var pf = req.body.Payment_Response;
			var Payment_Status = 0;
			if(pf.toLowerCase() != "cancel"){
				if(calchash == resphash)
					Payment_Status = 1;
				else
					Payment_Status = 3;
			}else
				Payment_Status = 2;

			var UPD = {Payment_Status: Payment_Status, Status_ID: Payment_Status == 1 ? 1 : 0,
				Payment_Details: details};
			self.db.update('booking', $wh, UPD, (err, result) => {
				var response = common.getResponses('MNS031', {});
				if(Payment_Status == 1 && parseInt(result.result.nModified) === 1){
					response = common.getResponses('MNS011', {});
					/*self.sendEmailToUser(book.ID, book.user.Email_Id);*/
				}
				else if(Payment_Status == 2)
					response = common.getResponses('MNS012', {});
				else if(Payment_Status == 3)
					response = common.getResponses('MNS013', {});
				res.json(response);
			});
		};

		self.db.connect((db) => {
			db.collection('booking').aggregate(lookups, (err, booked) => {
				if(booked.length > 0){
					booked = booked[0];
					checkProcess(booked);
				}else
					res.json(common.getResponses('MNS031', {}));
			});
		});
	};
	this.onPaymentFinished = function(req, res) {
		if(typeof req.body.Booking_ID != 'string' || typeof req.body.Payment_Response != 'string'){
			res.json(common.getResponses('MNS003', {}));
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
			var response = common.getResponses('MNS031', {});
			if(Payment_Status == 1 && parseInt(result.result.nModified) === 1){
				response = common.getResponses('MNS011', {});
				/*self.sendEmailToUser(req.body.Booking_ID);*/
			}
			else if(Payment_Status == 2)
				response = common.getResponses('MNS012', {});
			else if(Payment_Status == 3)
				response = common.getResponses('MNS013', {});
			res.json(response);
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
				{User_Type: common.getUserType(0)},
				{User_Type: common.getUserType(1)}
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

	this.cancelBooking = function(req, res) {
		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		if(!req.params.hasOwnProperty('BID')){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		var $match = {ID: req.params.BID};
		self.db.get('booking', $match, data => {

			if(data.length > 0) {
				data = data[0];
				if(data.User_ID == req.accessUser._id 
					|| req.accessUser.User_Type == common.getUserType(0) 
					|| req.accessUser.User_Type == common.getUserType(1)){
					var UPD = {Status_ID: 5};
					self.db.update('booking', $match, UPD, (err, result) => {
						var r = result.matchedCount > 0 
						&& result.modifiedCount > 0 ? 'MNS033' : 'MNS031';
						res.json(common.getResponses(r, {}));
					});
				}else
					res.json(common.getResponses('MNS031', {}));
			}else
				res.json(common.getResponses('MNS031', {}));
		});
	}

	this.getBookingList = function(req, res){

		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}	

		var afterValid = function(UT, UID){
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
			    },
			    { $sort : { "Session_Time.From" : typeof req.query.desc !== 'undefined' ? -1 : 1 } }
			];
			if(UT == common.getUserType(3)){/*return customer*/
				lookups.push({
					$match: {User_ID: UID}
				});
			}
			if(typeof req.params.offset !== 'undefined'){
				var lmt = typeof req.query.limit == 'undefined' ? 10 : req.query.limit;
				lookups.push({ $limit: lmt});
				lookups.push({ $skip: parseInt(req.params.offset)});
			}			
			self.db.connect((db) => {
				db.collection('booking').aggregate(lookups, (err, data) => {

					if(data.length == 0){
						res.json(common.getResponses('MNS021', data));
						return;
					}

					var c1 = c2 = 0;				
					data.forEach((d, k) => {
						if(d.Status_ID == 2 || d.Labour_ID.length > 0)
							c1++;
					});

					if(c1 == 0){
						res.json(common.getResponses('MNS020', common.seperate(data) ));
						return;
					}

					data.forEach((d, k) => {
						if(d.Status_ID == 2 || d.Labour_ID.length > 0){						
							self.db.get('user', {_id: {$in: d.Labour_ID}, User_Type: common.getUserType(2)}, (lab) => {
								c2++;
								data[k].Labours = [];
								lab.forEach((l, kk) => {
									if(l.hasOwnProperty('avatar'))
										l.avatar = config.liveUrl + 'image/avatar/' + l.avatar;
									if(l.hasOwnProperty('Id_Prof'))
										l.Id_Prof = config.liveUrl + 'docs/labour_docs/' + l.Id_Prof;
									if(l.hasOwnProperty('DOB')){			
										var dob = l.DOB.split('-');
										if(dob.length > 2)
											l.DOB = dob[2] + '/' + dob[1] + '/' + dob[0];
									}
									delete l.password;
									delete l.accessToken;
									delete l.Verification_Mai;
									data[k].Labours.push(l);
								});
								if(c1 == c2)
									res.json(common.getResponses('MNS020', common.seperate(data) ));//removefield
							});
						}
					});				
			  	});
			});
		};

		afterValid(req.accessUser.User_Type, req.accessUser._id);
	};
	this.getLabourForBooking = function(req, res){

		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		if(!req.params.hasOwnProperty('BID')){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if( !(req.accessUser.User_Type == common.getUserType(0) ||
			req.accessUser.User_Type == common.getUserType(1)) ){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		self.db.connect((newdb) => {
			var lk = [
				{
					$lookup: {
						from: 'service_type',
						localField: 'Service_Type_ID',
						foreignField: '_id',
						as: 'service_type'
					}
				},
				{
					$match: {ID: req.params.BID}
				},
				{
					$replaceRoot: {
				        newRoot: {
				            $mergeObjects: [		            	
				            	"$$ROOT",
				            	{service_type: { $arrayElemAt: [ "$service_type", 0 ] }}
				            ]
				        }
				    }
			    }
			]
			newdb.collection('booking').aggregate(lk, (err, book) => {
				callBack(book);
			});
		});

		var callBack = function(data){
			if(data.length > 0){
				var reqFrom = data[0].Session_Time.From.split(' ')[1];
				var reqTo = data[0].Session_Time.To.split(' ')[1];

				var $superservice = [{Service_Type_ID: data[0].Service_Type_ID}];

				if(data[0].service_type.parent.length > 0){
					data[0].service_type.parent.forEach((pid, k) => {
						$superservice.push({Service_Type_ID: pid});
					});
				}

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
								{Locality_ID: data[0].Locality_ID},
								{User_Type: common.getUserType(2)},
								{'Service_Time.From': { $lte: reqFrom}},
								{'Service_Time.To': { $gte: reqTo}},
								{$or: $superservice},
								{'Last_Service.From': {$ne: data[0].Session_Time.From}},
								{'Last_Service.To': {$ne: data[0].Session_Time.To}}
							]
						}
					}
				];
				lookups.push({ $project : { password: 0, Verification_Mail : 0 , accessToken : 0 } });
				if(typeof req.params.offset !== 'undefined'){
					lookups.push({ $limit: 10});
					lookups.push({ $skip: parseInt(req.params.offset)});
				}
				self.db.connect((db) => {
					db.collection('user').aggregate(lookups, (err, labour) => {

						var rt = [];
						if(labour.length > 0){
							labour.forEach((u, k) => {
								if(u.hasOwnProperty('avatar'))
									u.avatar = config.liveUrl + 'image/avatar/' + u.avatar;
								if(u.hasOwnProperty('Id_Prof'))
									u.Id_Prof = config.liveUrl + 'docs/labour_docs/' + u.Id_Prof;
								if(u.hasOwnProperty('DOB')){			
									var dob = u.DOB.split('-');
									if(dob.length > 2)
										u.DOB = dob[2] + '/' + dob[1] + '/' + dob[0];
								}
								rt.push(u);
							});
						}

						if(labour.length > 0)
							res.json(common.getResponses('MNS020', rt));//removefield
						else
							res.json(common.getResponses('MNS032', rt));//removefield
				  	});
				});
			}else
				res.json(common.getResponses('MNS021', {}));
		};
	};//9:30 < 14:00 && 18:30 > 15:00
	this.AssignLabour = function(req, res){

		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		if(typeof req.body.Booking_ID == 'undefined' ||
			typeof req.body.Labour_ID == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if( !(req.accessUser.User_Type == common.getUserType(0) ||
			req.accessUser.User_Type == common.getUserType(1)) ){
			res.json(common.getResponses('MNS005', {}));
			return;
		}
		
		var Labour_ID = typeof req.body.Labour_ID == 'string' ? 
			[req.body.Labour_ID] : req.body.Labour_ID;
		var UPD = {Labour_ID: Labour_ID, Status_ID: 2};

		var callBack = function(){
			self.db.update('booking', {ID: req.body.Booking_ID}, UPD, (err, result) => {
				var r = result.matchedCount > 0 ? 'MNS014' : 'MNS031';
				res.json(common.getResponses(r, {}));
			});
		}
		self.db.get('booking', {ID: req.body.Booking_ID}, book => {
			if(book.length > 0){
				book = book[0];				
				setTimeout(() => {
					self.db.update('user', {_id: {$in: Labour_ID}}, 
						{Last_Service: book.Session_Time},(err, result) => {});
				}, 1000);
				callBack();
			}
		});

	};
};

 module.exports = Booking;