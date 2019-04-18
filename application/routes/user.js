var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');
var path = require('path');
const fs = require('fs');

function User() {
	var self = this;
	self.db = config.db;
	config.setSMTPConfig((smtp) => {
		this.smtp = smtp;
	});
	this.checkUserExist = function(email, MN, cb) {
		var cond = {$or: [
			{Email_Id: email},
			{Mobile_Number: MN}
		]};
		if(email == '')
			cond = {Mobile_Number: MN};
		if(MN == '')
			cond = {Email_Id: email};
		self.db.get('user', cond, data => {
			var existType = 0;
			if(data.length > 0){
				if(data[0].Email_Id == email)
					existType = 1;//email
				else if(data[0].Mobile_Number == MN)
					existType = 2;//mobno
				else
					existType = 3;//email & mobno
			}
			cb(existType, user);
		});
	};

	this.auth = function(){
		return function(req, res, next){

			if(req.headers.hasOwnProperty('token')){

				var token = req.headers.token;
				self.isValidAccessToken(token, (isValid, user) => {
					if(isValid){
						req.accessToken = token;
						req.accessUser = user;
						next();
					}
					else
						res.json(common.getResponses('MNS005', {}));
				});

			}else
				next();
		};
	};

	this.getUser = function(req, res){

		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		if(req.accessUser.User_Type != common.getUserType(0) &&
			req.accessUser.User_Type != common.getUserType(1)){
			res.json(common.getResponses('MNS037', {}));
			return;
		}

		var matchAnd = [];
		var lookups = [];
		lookups.push({ $project : { password: 0, Verification_Mail : 0 , accessToken : 0 } });
		if(typeof req.params.type !== 'undefined'){
			var UT = parseInt(req.params.type);
			matchAnd.push({User_Type: UT});
			if(UT == common.getUserType(2)){
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

				var rt = [];
				if(user.length > 0){
					user.forEach((u, k) => {
						if(u.hasOwnProperty('avatar'))
							u.avatar = config.liveUrl + 'image/avatar/' + u.avatar;
						if(u.hasOwnProperty('Id_Prof'))
							u.Id_Prof = config.liveUrl + 'image/avatar/' + u.Id_Prof;
						if(u.hasOwnProperty('DOB')){			
							var dob = u.DOB.split('-');
							if(dob.length > 2)
								u.DOB = dob[2] + '/' + dob[1] + '/' + dob[0];
						}
						rt.push(u);
					});
				}

				res.json(common.getResponses('MNS020', rt));
		  	});
		});
	};
	this.Signin = function(req, res){

		if(typeof req.body.email == 'undefined' ||
			typeof req.body.password == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
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
				res.json(common.getResponses('MNS004', {}));
			}else{
				if(data[0].isActivated == 1){
					var token = common.gToken(30);				
					var tokens = !data[0].hasOwnProperty('accessToken') || typeof data[0].accessToken.length == 'undefined' 
					|| typeof data[0].accessToken == 'string' ? [] : data[0].accessToken;
					tokens.push(token);
					self.db.update('user', {_id: data[0]._id}, {accessToken: tokens}, (err, result) => {
						res.json(common.getResponses('MNS020', {accessToken: token,
						User_Type: data[0].User_Type}));						
					});
				}else
					res.json(common.getResponses('MNS023', {}));
			}
		});
	};

	this.SignOut = function(req, res){
		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		var data = req.accessUser;
		var tokens = !data.hasOwnProperty('accessToken') || typeof data.accessToken.length == 'undefined' 
			|| typeof data.accessToken == 'string' ? [] : data.accessToken;
		tokens.splice(tokens.indexOf(req.accessToken), 1);
		self.db.update('user', {_id: data._id}, {accessToken: tokens}, (err, result) => {
			res.json(common.getResponses('MNS024', {}));
		});
	};

	this.SignUp = function(req, res){
		if(typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined' ||
			typeof req.body.Mobile_Number == 'undefined' ||
			typeof req.body.password == 'undefined' || 
			typeof req.body.cpassword == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if(req.body.password != req.body.cpassword){
			res.json(common.getResponses('MNS025', {}));
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
						res.json(common.getResponses('MNS015', {}));
					else if(data[0].Mobile_Number == req.body.Mobile_Number)
						res.json(common.getResponses('MNS016', {}));
					else
						res.json(common.getResponses('MNS030', {}));
				}else{
					var link = common.frontEndUrl + "setpassword?token="
					+ verifyToken;	
					var UPD = {Verification_Mail: Verification_Mail};
					self.db.update('user', {_id: data[0]._id}, UPD, (err, result) => {
						self.verificationMail(link, data[0].Email_Id, "Generate Password");
						res.json(common.getResponses('MNS008', {type: 2}));
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
					User_Type: common.getUserType(3),
					isActivated: 0,
					Verification_Mail: Verification_Mail
				};
				var link = common.frontEndUrl + "validateuser?token="
					+ verifyToken;
				self.db.insert('user', newUser, (err, result) => {
			    	self.verificationMail(link, req.body.Email_Id, "Activation");
					res.json(common.getResponses('MNS009', {type: 1}));
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
			res.json(common.getResponses('MNS006', {}));
			return;
		}
		var token = req.query.token;
		self.isValidToken(token, (data, isValid, isExpired) => {
			if(isValid && isExpired){
				res.json(common.getResponses('MNS007', {}));
			}
			else if(isValid && !isExpired){
				self.db.update('user', {_id: data[0]._id}, {isActivated: 1, Verification_Mail: {}}, (err, result) => {
					res.json(common.getResponses('MNS027', {}));
				});
			}else{
				res.json(common.getResponses('MNS006', {}));
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
		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}
		var token = req.accessToken;
		var user = req.accessUser;
		if(user.hasOwnProperty('avatar'))
			user.avatar = config.liveUrl + 'image/avatar/' + user.avatar;
		if(user.hasOwnProperty('Id_Prof'))
			user.Id_Prof = config.liveUrl + 'image/avatar/' + user.Id_Prof;
		if(user.hasOwnProperty('DOB')){			
			var dob = user.DOB.split('-');
			if(dob.length > 2)
				user.DOB = dob[2] + '/' + dob[1] + '/' + dob[0];
		}
		delete user.password;
		delete user.accessToken;
		delete user.Verification_Mail;
	    res.json(common.getResponses('MNS020', user));
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
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		self.db.get('user', {Email_Id: req.body.Email_Id}, (data) => {
			if(data.length == 0)
				res.json(common.getResponses('MNS017', {}));
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
					res.json(common.getResponses('MNS029', {}));
				});
			}
		});
	};

	this.setPassword = function(req, res){
		if(!req.body.hasOwnProperty('verifyToken')){
			res.json(common.getResponses('MNS006', {}));
			return;
		}

		if(typeof req.body.New_Password == 'undefined' ||
			typeof req.body.Confirm_Password == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if(req.body.New_Password != req.body.Confirm_Password){
			res.json(common.getResponses('MNS025', {}));
			return;
		}

		var token = req.body.verifyToken;
		self.isValidToken(token, (data, isValid, isExpired) => {
			if(isValid && isExpired){
				res.json(common.getResponses('MNS007', {}));
			}
			else if(isValid && !isExpired){
				var UPD = {
					password: common.MD5(req.body.New_Password),
					isActivated: 1,
					Verification_Mail: {token: '', gtime: ''}
				};
				self.db.update('user', {_id: data[0]._id}, UPD, (err, result) => {
					res.json(common.getResponses('MNS028', {}));
				});
			}else{
				res.json(common.getResponses('MNS006', {}));
			}
		});
		
	};


	this.changePassword = function(req, res){
		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		if(typeof req.body.New_Password == 'undefined' || 
			typeof req.body.Confirm_Password == 'undefined' || 
			typeof req.body.Old_Password == 'undefined'){
			res.json(common.getResponses('MNS003', {}));
			return;
		}

		if(req.body.New_Password != req.body.Confirm_Password){
			res.json(common.getResponses('MNS025', {}));
			return;
		}

		if(common.MD5(req.body.Old_Password) != req.accessUser.password){
			res.json(common.getResponses('MNS034', {}));
			return;
		}

		var UPD = {
			password: common.MD5(req.body.New_Password)
		};
		self.db.update('user', {_id: req.accessUser._id}, UPD , (err, result) => {
			res.json(common.getResponses('MNS028', {}));
		});

	};

	this.updateUser = function(req, res) {
		if(!req.hasOwnProperty('accessToken') || !req.hasOwnProperty('accessUser')){
			res.json(common.getResponses('MNS005', {}));
			return;
		}

		var UPD = {};
		if(typeof req.body.First_Name != 'undefined')
			UPD.First_Name = req.body.First_Name;
		if(typeof req.body.Last_Name != 'undefined')
			UPD.Last_Name = req.body.Last_Name;
		if(typeof req.body.Alternate_Mobile_Number != 'undefined')
			UPD.Alternate_Mobile_Number = req.body.Alternate_Mobile_Number;
		if(typeof req.body.Gender != 'undefined')
			UPD.Gender = req.body.Gender;
		if(typeof req.body.DOB != 'undefined')
			UPD.DOB = req.body.DOB;
		

		var avatarExt = avatarFileName = avatarTargetPath = '';
		var avatarDir = './application/uploads/avatars/';
		if(typeof req.file != 'undefined'){
			if(typeof req.file.path != 'undefined'){
				var removeUpload = function(){
					if (fs.existsSync(req.file.path))
						fs.unlinkSync(req.file.path);
				};				
				try {
					if (!fs.existsSync(avatarDir))
					    fs.mkdirSync(avatarDir);
				} catch (err) {
					removeUpload();
					res.json(common.getResponses('MNS035', {}));
					return;
				}

				if(typeof req.fileError != 'undefined'){
					removeUpload();
					res.json(common.getResponses(req.fileError, {}));
					return;
				}

				var avatarExt = path.extname(req.file.path);
				if(avatarExt == '.pdf'){
					removeUpload();
					res.json(common.getResponses('MNS038', {}));
					return;
				}
				avatarFileName = 'MNS_' + req.accessUser._id + avatarExt;
				avatarTargetPath = avatarDir + avatarFileName;
				UPD.avatar = avatarFileName;
				try {
		       		fs.renameSync(req.file.path, avatarTargetPath);
		       	} catch (err) {
		       		res.json(common.getResponses('MNS035', {}));
					return;
		       	}
		    }
		}

		self.db.update('user', {_id: req.accessUser._id}, UPD, (err, result) => {
			res.json(common.getResponses('MNS002', {avatarDir: config.liveUrl + 'image/avatar/'}));
		});
	};
}

module.exports = User;