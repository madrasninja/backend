var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');

function User() {
	var self = this;
	self.db = config.db;
	config.setSMTPConfig((smtp) => {
		this.smtp = smtp;
	});
	this.checkUserExist = function(MN, cb) {
		self.db.get('user', {Mobile_Number: MN}, user => {
			cb(user.length > 0, user);
		});
	};

	this.auth = function(){
		return function(req, res, next){

			if(req.headers.hasOwnProperty('token')){

				var token = req.headers.token;
				self.isValidAccessToken(token, (isValid, user) => {
					if(isValid){
						req.accessToken = token;
						next();
					}
					else
						res.json({response: 'error', message: 'Invalid Access Token'});
				});

			}else
				next();
		};
	};

	this.getUser = function(req, res){

		if(!req.hasOwnProperty('accessToken')){
			res.json({response: 'error', message: 'Invalid Access Token'});
			return;
		}
		
		var matchAnd = [];
		var lookups = [];
		lookups.push({ $project : { password: 0, Verification_Mail : 0 , accessToken : 0 } });
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
				if(data[0].isActivated == 1){
					var token = common.gToken(30);				
					var tokens = !data[0].hasOwnProperty('accessToken') || typeof data[0].accessToken.length == 'undefined' 
					|| typeof data[0].accessToken == 'string' ? [] : data[0].accessToken;
					tokens.push(token);
					self.db.update('user', {_id: data[0]._id}, {accessToken: tokens}, (err, result) => {
						res.json({result: 'success', accessToken: token,
						message: 'Valid User', User_Type: data[0].User_Type});
					});
				}else
					res.json({result: 'error', message: 'Account Does\'nt Activated'});
			}
		});
	};

	this.SignOut = function(req, res){
		if(!req.hasOwnProperty('accessToken')){
			res.json({response: 'error', message: 'Invalid Access Token'});
			return;
		}

		self.isValidAccessToken(req.accessToken, (isValid, data) => {
			if(isValid){
				var tokens = !data.hasOwnProperty('accessToken') || typeof data.accessToken.length == 'undefined' 
					|| typeof data.accessToken == 'string' ? [] : data.accessToken;
				tokens.splice(tokens.indexOf(req.accessToken), 1);
				self.db.update('user', {_id: data._id}, {accessToken: tokens}, (err, result) => {
					res.json({result: 'success', message: 'Access Token Removed'});
				});
			}else{
				res.json({response: 'error', message: 'Invalid Access Token'});
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

			var verifyToken = common.gToken(30);						
			var Verification_Mail = {
				token: verifyToken,
				gtime: common.current_time()
			};

			if(data.length > 0){
				if(typeof data[0].password != 'undefined'){
					if(data[0].Email_Id == req.body.Email_Id)
						res.json({response: 'error', message: 'Email Address Already Exist!'});
					else if(data[0].Mobile_Number == req.body.Mobile_Number)
						res.json({response: 'error', message: 'Mobile Number Already Exist!'});
					else
						res.json({response: 'error', message: 'Email or Mob Already Exist!'});
				}else{
					var link = common.frontEndUrl + "setpassword?token="
					+ verifyToken;	
					var UPD = {Verification_Mail: Verification_Mail};
					self.db.update('user', {_id: data[0]._id}, UPD, (err, result) => {
						self.verificationMail(link, data[0].Email_Id, "Generate Password");
						res.json({response: 'success', message: 'You Have Already a User. '+
							'We will send you a mail for generate your new password', type: 2});
					});
				}
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
					User_Type: 3,
					isActivated: 0,
					Verification_Mail: Verification_Mail
				};
				var link = common.frontEndUrl + "validateuser?token="
					+ verifyToken;
				self.db.insert('user', newUser, (err, result) => {
			    	self.verificationMail(link, req.body.Email_Id, "Activation");
					res.json({response: 'success', message: 'User Created Successfull. '+
							'We will send you a mail for activate your account', type: 1});
			    });
			}
		});
	};

	this.verificationMail = function(link, UEmail, subject){

		var hitSend = (settings, TO, subject) => {
			var title = settings.length > 0 ? settings[0].title : '';
			var adminMail = settings.length > 0 ?
				settings[0].smtp_config.auth.user : config.smtp_config.auth.user;
			var content = '<h3>'+title+'</h3>';
			content += '<p><a href="'+link+'">click here to do action</a></p>'; 
			content += '<p>Thanks</p><p>Madras Ninja Bot</p>';
			self.smtp.getFile({title: title, content: content}, (d) => {
				var mail = {
				    from: adminMail,
				    to: TO,
				    subject: subject,
				    html: d.html
				};
				self.smtp.sendMail(mail, (err, res) => {
					if (err) {console.log(err);}
				});
			});
		};

		self.db.get('settings', {}, (settings) => {
			hitSend(settings, UEmail, subject);
		});

	};

	this.Validate_Token = function(req, res){

		if(typeof req.query.token == 'undefined'){
			res.json({response: 'error', message: 'Invalid Token'});
			return;
		}
		var token = req.query.token;
		self.isValidToken(token, (data, isValid, isExpired) => {
			if(isValid && isExpired){
				res.json({response: 'error', message: 'Token Expired'});
			}
			else if(isValid && !isExpired){
				self.db.update('user', {_id: data[0]._id}, {isActivated: 1}, (err, result) => {
					res.json({response: 'success', message: 'This is a valid token'});
				});
			}else{
				res.json({response: 'error', message: 'Invalid Token'});
			}
		});
	};

	this.isValidToken = function(token, cb){
		self.db.get('user', {"Verification_Mail.token": token}, (data) => {
			if(data.length > 0){
				var ct = common.current_time();
				var gt = new Date(data[0].Verification_Mail.gtime);
				gt = common.current_time(
					common.addHours(gt, 0.5));
				if(ct <= gt )
					cb(data, true, false);
				else
					cb(data, true, true);
			}
			else
				cb(data, false, false);
		});
	};

	this.Get_Me = function(req, res){
		if(typeof req.headers.token == 'undefined'){
			res.json({response: 'error', message: 'Invalid Access Token'});
			return;
		}
		var token = req.headers.token;
		self.isValidAccessToken(token, (isValid, user) => {
			if(isValid){
				delete user.password;
				delete user.accessToken;
				delete user.Verification_Mail;
			    res.json({response: 'success', user: user});
			}
			else
				res.json({response: 'error', message: 'Invalid Access Token'});
		});
	};

	this.isValidAccessToken = function(token, cb){
		self.db.get('user', {accessToken: {$all: [token]}}, (data) => {
			if(data.length > 0)
			    cb(true, data[0]);
			else
				cb(false, data);
		});
	};

	this.forgetPassword = function(req, res){

		if(typeof req.body.Email_Id == 'undefined'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		self.db.get('user', {Email_Id: req.body.Email_Id}, (data) => {
			if(data.length == 0)
				res.json({response: 'error', message: 'Invalid Email Address'});
			else{
				var verifyToken = common.gToken(30);						
				var Verification_Mail = {
					token: verifyToken,
					gtime: common.current_time()
				};
				var link = common.frontEndUrl + "setpassword?token="
				+ verifyToken;	
				var UPD = {Verification_Mail: Verification_Mail};
				self.db.update('user', {_id: data[0]._id}, UPD, (err, result) => {
					self.verificationMail(link, data[0].Email_Id, "Reset Password");
					res.json({response: 'success', message: 'We will send you a mail for reset your password'});
				});
			}
		});
	};

	this.setPassword = function(req, res){
		if(!req.body.hasOwnProperty('verifyToken')){
			res.json({response: 'error', message: 'Invalid Token'});
			return;
		}

		if(typeof req.body.New_Password == 'undefined' ||
			typeof req.body.Confirm_Password == 'undefined'){
			res.json({response: 'error', message: 'Wrong Input'});
			return;
		}

		if(req.body.New_Password != req.body.Confirm_Password){
			res.json({response: 'error', message: 'Confirm Password Mismatch!'});
			return;
		}

		var token = req.body.verifyToken;
		self.isValidToken(token, (data, isValid, isExpired) => {
			if(isValid && isExpired){
				res.json({response: 'error', message: 'Token Expired'});
			}
			else if(isValid && !isExpired){
				var UPD = {
					password: common.MD5(req.body.New_Password),
					Verification_Mail: {token: '', gtime: ''}
				};
				self.db.update('user', {_id: data[0]._id}, UPD, (err, result) => {
					res.json({response: 'success', message: 'Password Updated'});
				});
			}else{
				res.json({response: 'error', message: 'Invalid Token'});
			}
		});
		
	};
}

module.exports = User;