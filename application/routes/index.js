
var Booking = require('./Booking.js');
var Labour = require('./labour.js');
var User = require('./user.js');
var common = require('../public/common.js');


var multer  = require('multer');
var path = require('path');
const fs = require('fs');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		var dir = './application/uploads/tmp/';
		try {
			if (!fs.existsSync(dir)){
			    fs.mkdirSync(dir);
			}
			cb(null, dir);
		} catch (err) {
			//req.json(common.getResponses('MNS035', {}));
			req.fileError = 'MNS035';
			cb(null, dir);
			return;
		}	    
	},
	filename: function (req, file, cb) {
	    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});
var upload = multer({ storage: storage,
	fileFilter: function (req, file, cb) {
	    if(['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'].indexOf(file.mimetype) != -1){
	    	cb(null, true);
	    	return;
		}else{
			//req.json(common.getResponses('MNS036', {}));
			req.fileError = 'MNS036';
			return cb(null, false, new Error('Not an image'));
		}
	} });

function Routes(app){
	var self = this;
	self.db = require('../config').db;
	Booking = new Booking();
	Labour = new Labour();
	User = new User();
	app.get('/', function(req, res) {
		self.db.get('settings', {}, function(data){
			if(data.length == 1)
				res.json({title: data[0].title});
			else
				res.json({});
			//res.render('index', {data : data});
		});
	});
	self.r = app;

	app.get('/getservicetypelist', User.auth(), function(req, res) {
		self.db.get('service_type', {}, service_type => {
			res.json(common.getResponses('MNS020', service_type));
		});
	});

	app.get('/getlocalitylist', User.auth(), function(req, res) {
		self.db.get('locality', {}, locality => {
			res.json(common.getResponses('MNS020', locality));
		});
	});

	app.get('/getstatuslist', User.auth(), function(req, res) {
		self.db.get('status', {}, status => {
			res.json(common.getResponses('MNS020', status));
		});
	});


	/*app.get('/on_booking', Booking.onBooking);*/

	app.post('/bookservice', User.auth(), Booking.onSubmitBooking);
	app.get('/cancelbooking/:BID', User.auth(), Booking.cancelBooking);

	app.post('/proceedforpayment', User.auth(), Booking.onPaymentFinished);

	app.get('/getbookinglist/:offset', User.auth(), Booking.getBookingList);

	app.get('/getbookinglist', User.auth(), Booking.getBookingList);

	var uploadFields = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'Id_Prof', maxCount: 1 }]);
	app.post('/savelabour', uploadFields, Labour.executeUpdate);

	app.get('/getlabourforbooking/:BID/:offset', User.auth(), Booking.getLabourForBooking);

	app.get('/getlabourforbooking/:BID', User.auth(), Booking.getLabourForBooking);

	app.post('/assignlabour', User.auth(), Booking.AssignLabour);

	app.get('/getuser/:type/:ID', User.auth(), User.getUser);
	app.get('/getuser/:type', User.auth(), User.getUser);
	app.get('/getuser', User.auth(), User.getUser);	

	app.post('/login', User.auth(), User.Signin);
	app.post('/signup', User.auth(), User.SignUp);
	app.get('/logout', User.auth(), User.SignOut);
	app.get('/validatetoken', User.auth(), User.Validate_Token);
	app.get('/getme', User.auth(), User.Get_Me);
	app.post('/forgetpassword', User.auth(), User.forgetPassword);
	app.post('/setpassword', User.auth(), User.setPassword);
	app.post('/changepassword', User.auth(), User.changePassword);
	app.post('/updateuser', User.auth(), upload.single('avatar'), User.updateUser);

	app.get('/image/avatar/:img', function(req, res){

		if(!req.params.hasOwnProperty('img')){
			res.send('404 Error');
			return;
		}
		var imgPath = __dirname + '/../uploads/avatars/' + req.params.img;
		if (fs.existsSync(imgPath))
			res.sendFile(path.resolve(imgPath));
		else
			res.status(404).send('404 Error');
	});

	app.get('/docs/labour_docs/:doc', function(req, res){

		if(!req.params.hasOwnProperty('doc')){
			res.send('404 Error');
			return;
		}
		var imgPath = __dirname + '/../uploads/labour_docs/' + req.params.doc;
		if (fs.existsSync(imgPath))
			res.sendFile(path.resolve(imgPath));
		else
			res.status(404).send('404 Error');
	});
}

module.exports = Routes;