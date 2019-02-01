
var Booking = require('./Booking.js');

function Routes(app){
	var self = this;
	self.db = require('../config').db;
	Booking = new Booking(self.db);
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

	app.get('/on_booking', Booking.onBooking);

	app.post('/on_submit_booking', Booking.onSubmitBooking);

	app.post('/on_payment_finished', Booking.onPaymentFinished);
}

module.exports = Routes;