
var Booking = require('./Booking.js');
var Labour = require('./labour.js');
var User = require('./user.js');
var common = require('../public/common.js');

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

	app.post('/proceedforpayment', User.auth(), Booking.onPaymentFinished);

	app.get('/getbookinglist/:offset', User.auth(), Booking.getBookingList);

	app.get('/getbookinglist', User.auth(), Booking.getBookingList);

	app.post('/savelabour', Labour.executeUpdate);

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
}

module.exports = Routes;