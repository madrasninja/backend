
var DB = require('./db');
var SMTP = require('./SMTPmailConfig.js');

var main = {
	development: {
		name: 'Node App',
		port: process.env.PORT || 5000
	},
	production: {
		name: 'Node App',
		port: process.env.PORT || 5000
	},
	db: new DB(),
	smtp_config: {
	    host: "smtp.gmail.com",
	    port: 465,
	    secure: true, 
	    auth: {
	        user: "smix.1234890@gmail.com",
	        pass: "1234.Smix"
	    }
	},
	PayUMoney: {
		key: 'pVxlltPH',
		salt: 'IOveTryfby',
		udf5: 'BOLT_KIT_NODE_JS',
		productInfo: 'Madras Ninja Service',
		testAmount: '20.00'
	},
	dbName: 'madrasninja',
	liveUrl: 'https://api.madrasninja.com/',
	session_time: 999999999999,
	initApp: function(dir){
		main.app_dir = dir;		
		return main;
	},
	setSMTPConfig: function(cb){
		main.db.get('settings', {}, (settings) => {
			var smtp;
			if(settings.length > 0)
				smtp = new SMTP(settings[0].smtp_config);
			else
				smtp = new SMTP(main.smtp_config);
			cb(smtp);
		});
	}
};

module.exports = main;
