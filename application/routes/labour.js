var ObjectId = require('mongodb').ObjectId;
var config = require('../config/index.js');
var common = require('../public/common.js');
var User = require('./user.js');
var path = require('path');
const fs = require('fs');

function Labour() {
	var self = this;
	self.db = config.db;
	User = new User();

	this.fileUpload = function(files, insId, res, resData) {
		var avatarExt = avatarFileName = avatarTargetPath = '';
		var idProfExt = idProfFileName = idProfTargetPath = '';
		var avatarDir = './application/public/uploads/avatars/';
		var labourDir = './application/public/uploads/labour_docs/';
		try {
			if (!fs.existsSync(avatarDir))
			    fs.mkdirSync(avatarDir);
			if (!fs.existsSync(labourDir))
			    fs.mkdirSync(labourDir);
		} catch (err) {
			res.json(common.getResponses('MNS035', {}));
			return;
		}		
		
		var UPD = {};
		if(typeof files.avatar != 'undefined'){
			avatarExt = path.extname(files.avatar[0].path);
			if(avatarExt =='.pdf'){
				res.json(common.getResponses('MNS038', {}));
				return;
			}
			avatarFileName = 'MNS_' + insId + avatarExt;
			avatarTargetPath = avatarDir + avatarFileName;
			UPD.avatar = avatarFileName;
			try {
	       		fs.renameSync(files.avatar[0].path, avatarTargetPath);
	       	} catch (err) {
	       		res.json(common.getResponses('MNS035', {}));
				return;
	       	}
	    }

	    if(typeof files.Id_Prof != 'undefined'){
	    	idProfExt = path.extname(files.Id_Prof[0].path);
			idProfFileName = 'MNS_' + insId + idProfExt;
			idProfTargetPath = labourDir + idProfFileName;
			UPD.Id_Prof = idProfFileName;
			try {
	       		fs.renameSync(files.Id_Prof[0].path, idProfTargetPath);
	       	} catch (err) {
	       		res.json(common.getResponses('MNS035', {}));
				return;
	       	}
	    }
	    if(UPD.hasOwnProperty('avatar') || UPD.hasOwnProperty('Id_Prof')){
	        self.db.update('user', {_id: insId}, UPD, (err, result) => {
	        	res.json(resData);
	        });
	    }else
	    	res.json(resData);
	};

	this.executeUpdate = function(req, res) {

		var sendResponse = function(dt){
			var insId = '';
			if(dt.data.hasOwnProperty('insert_id'))
				insId = dt.data.insert_id;
			if(dt.data.hasOwnProperty('update_id'))
				insId = dt.data.update_id;
			if(insId != ''){		
				self.fileUpload(req.files, insId, res, dt);
			}else{
				if(typeof req.files.avatar != 'undefined'){
					if (fs.existsSync(req.files.avatar[0].path))
					    fs.unlinkSync(req.files.avatar[0].path);
				}
				if(typeof req.files.Id_Prof != 'undefined'){
					if (fs.existsSync(req.files.Id_Prof[0].path))
					    fs.unlinkSync(req.files.Id_Prof[0].path);
				}
				res.json(dt);
			}

		};

		var isAdd = false;
		if(typeof req.body._id == 'undefined')
			isAdd = true;
		else
			isAdd = req.body._id == '';

		if(typeof req.body.First_Name == 'undefined' ||
			typeof req.body.Email_Id == 'undefined' ||
			typeof req.body.Locality_ID == 'undefined' ||
			typeof req.body.Service_Type_ID == 'undefined' ||
			typeof req.body.Gender == 'undefined' || 
			typeof req.body.DOB == 'undefined' ||
			typeof req.body.Address == 'undefined'){
			sendResponse(common.getResponses('MNS003', {}));
			return;
		}

		if(typeof req.body.Service_Time_From == 'undefined' ||
			typeof req.body.Service_Time_To == 'undefined'){
			sendResponse(common.getResponses('MNS026', {}));
			return;
		}

		if(isAdd && typeof req.body.Mobile_Number == 'undefined'){
			sendResponse(common.getResponses('MNS022', {}));
			return;				
		}
		
		if(isAdd && (typeof req.files.avatar == 'undefined' ||
			typeof req.files.Id_Prof == 'undefined') ){
			sendResponse(common.getResponses('MNS003', {}));
			return;
		}

		var newUser = {
			First_Name: req.body.First_Name,
			Last_Name: typeof req.body.Last_Name != 'undefined' ? req.body.Last_Name : '',
			Email_Id: req.body.Email_Id,
			Alternate_Mobile_Number: typeof req.body.Alternate_Mobile_Number != 'undefined' ?
					req.body.Alternate_Mobile_Number : '',
			Locality_ID: req.body.Locality_ID,
			Service_Type_ID: req.body.Service_Type_ID,
			Service_Time: {
				From: req.body.Service_Time_From,
				To: req.body.Service_Time_To
			},
			Address: req.body.Address,
			Gender: req.body.Gender,
			DOB: req.body.DOB,
			User_Type: common.getUserType(2)
		};		

	    var cond = {};
	    if(isAdd){
	    	newUser._id = common.getMongoObjectId();
	    	newUser.Mobile_Number = req.body.Mobile_Number;
	    	cond = {$or: [
				{Email_Id: newUser.Email_Id},
				{Mobile_Number: newUser.Mobile_Number}
			]};
	    }else
	    	cond = {Email_Id: newUser.Email_Id, _id: {$ne: req.body._id}};

	    self.db.get('user', cond, existUser => {
	    	if(existUser.length > 0){
	    		existUser = existUser[0];
	    		if(isAdd){
	    			if(existUser.Email_Id == newUser.Email_Id)
	    				sendResponse(common.getResponses('MNS015', {}));
	    			else if(existUser.Mobile_Number == req.body.Mobile_Number)
	    				sendResponse(common.getResponses('MNS016', {}));
	    			else
	    				sendResponse(common.getResponses('MNS030', {}));
	    		}else
	    			sendResponse(common.getResponses('MNS015', {}));
	    	}else{
	    		if(isAdd){
	    			self.db.insert('user', newUser, (err, result) => {
				    	sendResponse(common.getResponses('MNS001', 
				    		{insert_id: newUser._id,
				    		 avatarDir: '/uploads/avatars/',
				    		  idProfDir: '/uploads/labour_docs/'
				    		}));
				    });
				}else{
		    		self.db.update('user', {_id: req.body._id}, newUser, (err, result) => {
						sendResponse(common.getResponses('MNS002', 
							{update_id: req.body._id,
							avatarDir: '/uploads/avatars/',
							idProfDir: '/uploads/labour_docs/'
						} ));
					});
				}
	    	}
	    });
	};
}

module.exports = Labour;