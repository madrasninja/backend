
var mailer = require("nodemailer");
var smtp =  mailer.createTransport({
    host: "smtp.gmail.com",/*https://www.google.com/settings/security/lesssecureapps*/
    port: 465,
    secure: true, 
    auth: {
        user: "smix.1234890@gmail.com",
        pass: "1234.Smix"
    }
});

/*
	officical site 
		https://nodemailer.com/about/
	stackoverflow: 
		https://stackoverflow.com/questions/4113701/sending-emails-in-node-js
	configuration reference:
		https://www.arclab.com/en/kb/email/how-to-enable-imap-pop3-smtp-gmail-account.html
*/

/*{
    from: "smix.1234890@gmail.com",
    to: "karthisg.sg@gmail.com",
    subject: "kjsdhfkjsdfhks hk",
    text: "adjsak",
    html: "<thmlasd>"
}*/

module.exports = {
	sendMail: function(mail, cb){
		smtp.sendMail(mail, function(error, response){
		    if(error)
		        cb(error, response);
		    else
		        cb(error, response);		    

		    smtp.close();
		});
	}
};	

