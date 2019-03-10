
var Booking = require('./Booking.js');
var Labour = require('./labour.js');
var User = require('./user.js');

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

	app.get('/getservicetypelist', function(req, res) {
		self.db.get('service_type', {}, service_type => {
			res.json(service_type);
		});
	});

	app.get('/getlocalitylist', function(req, res) {
		self.db.get('locality', {}, locality => {
			res.json(locality);
		});
	});

	app.get('/getstatuslist', function(req, res) {
		self.db.get('status', {}, status => {
			res.json(status);
		});
	});


	/*app.get('/on_booking', Booking.onBooking);*/

	app.post('/bookservice', Booking.onSubmitBooking);

	app.post('/proceedforpayment', Booking.onPaymentFinished);

	app.get('/getbookinglist/:offset', Booking.getBookingList);

	app.get('/getbookinglist', Booking.getBookingList);

	app.post('/savelabour', Labour.executeUpdate);

	app.get('/getlabourforbooking/:BID/:offset', Booking.getLabourForBooking);

	app.get('/getlabourforbooking/:BID', Booking.getLabourForBooking);

	app.post('/assignlabour', Booking.AssignLabour);

	app.get('/getuser/:type/:ID', User.getUser);
	app.get('/getuser/:type', User.getUser);
	app.get('/getuser', User.getUser);


	app.use(function(req, res, next){

		res.header('Access-Control-Allow-Headers', 'token');

		if(!req.headers.hasOwnProperty('token')){
			res.json({ response: 'error', message: "Invalid Access Token" });
			return;
		}

		var token = req.headers.token;
		User.isValidAccessToken(token, (isValid, user) => {
			if(isValid){
			    res.json({response: 'success', user: user});
			    next();
			}
			else
				res.json({response: 'error', message: 'Invalid Access Token'});
		});
	});

	app.post('/login', User.Signin);
	app.post('/signup', User.SignUp);
	app.get('/validatetoken', User.Validate_Token);
	app.get('/getme', User.Get_Me);
	app.post('/forgetpassword', User.forgetPassword);
	app.post('/setpassword', User.setPassword);
}

module.exports = Routes;