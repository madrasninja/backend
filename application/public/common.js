var ObjectId = require('mongodb').ObjectId;
String.prototype.getCharCode = function(){
	var rt=[];
	for(var i=0;i<this.length;i++){
		rt.push(this.charCodeAt(i));
	}
	return rt;
};

var responses = [
	{
		code: 'MNS001',
		message: 'Data\'s Inserted',
		data: {}
	},
	{
			code: 'MNS002',
			message: 'Data\'s Updated',
			data: {}
	},
	{
			code: 'MNS003',
			message: 'Wrong Input',
			data: {}
	},
	{
			code: 'MNS004',
			message: 'Invalid User',
			data: {}
	},
	{
			code: 'MNS005',
			message: 'Invalid Access Token',
			data: {}
	},
	{
			code: 'MNS006',
			message: 'Invalid Token',
			data: {}
	},
	{
			code: 'MNS007',
			message: 'Token Expired',
			data: {}
	},
	{
			code: 'MNS008',
			message: 'You Have Already a User. We will send you a mail for generate your new password',
			data: {}
	},
	{
			code: 'MNS009',
			message: 'User Created Successfull. We will send you a mail for activate your account',
			data: {}
	},
	{
			code: 'MNS010',
			message: 'Booking data\'s Saved and Idle For Payment Response',
			data: {}
	},
	{
			code: 'MNS011',
			message: 'Payment Done',
			data: {}
	},
	{
			code: 'MNS012',
			message: 'Payment Cancelled',
			data: {}
	},
	{
			code: 'MNS013',
			message: 'Payment Failed',
			data: {}
	},
	{
			code: 'MNS014',
			message: 'Labour Assigned SuccessFull',
			data: {}
	},
	{
			code: 'MNS015',
			message: 'Email Address Already Exist!',
			data: {}
	},
	{
			code: 'MNS016',
			message: 'Mobile Number Already Exist',
			data: {}
	},
	{
			code: 'MNS017',
			message: 'Invalid Email Address',
			data: {}
	},
	{
			code: 'MNS018',
			message: 'Session Time From & To is Required',
			data: {}
	},
	{
			code: 'MNS019',
			message: 'Data\'s Missing',
			data: {}
	},
	{
			code: 'MNS020',
			message: 'Success',
			data: {}
	},
	{
			code: 'MNS021',
			message: 'Booking Not Found',
			data: {}
	},
	{
			code: 'MNS022',
			message: 'Mobile Number\'s Required',
			data: {}
	},
	{
			code: 'MNS023',
			message: 'Account Does\'nt Activated',
			data: {}
	},
	{
			code: 'MNS024',
			message: 'Access Token Removed',
			data: {}
	},
	{
			code: 'MNS025',
			message: 'Confirm Password Mismatch!',
			data: {}
	},
	{
			code: 'MNS026',
			message: 'Service Time From & To is Required',
			data: {}
	},
	{
			code: 'MNS027',
			message: 'This is a valid token',
			data: {}
	},
	{
			code: 'MNS028',
			message: 'Password Updated',
			data: {}
	},
	{
			code: 'MNS029',
			message: 'We will send you a mail for reset your password',
			data: {}
	},
	{
			code: 'MNS030',
			message: 'Email Address & Mobile Number Already Exist!',
			data: {}
	},
	{
			code: 'MNS031',
			message: 'Invalid Booking ID',
			data: {}
	},
	{
			code: 'MNS032',
			message: 'Labour Not Available',
			data: {}
	},
	{
			code: 'MNS033',
			message: 'Booking Cancelled',
			data: {}
	},
	{
			code: 'MNS034',
			message: 'Wrong Password!',
			data: {}
	},
	{
			code: 'MNS035',
			message: 'Error File Upload',
			data: {}
	},
	{
			code: 'MNS036',
			message: 'File type miss match. Must upload png, jpg, jpeg or pdf',
			data: {}
	},
	{
			code: 'MNS037',
			message: 'Access Denied!',
			data: {}
	},
	{
			code: 'MNS038',
			message: 'File type miss match. Must upload png, jpg, jpeg',
			data: {}
	},
	{
			code: 'MNS039',
			message: 'Incorrect User Id',
			data: {}
	},
	{
			code: 'MNS040',
			message: 'User Deleted Successfull',
			data: {}
	}
];

module.exports = {
	frontEndUrl: "https://madrasninja.netlify.com/",
	uniqueid: function() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
		  return s4();
	},
	current_time: function(t) {
	  var t = typeof t === 'undefined' ? '' : t;
	  if(t != '')
	    t = typeof t !== 'object' ? new Date( t ) : t;
	  var time = t == '' ? new Date() : t;
	  var date = 
	    time.getFullYear() +'-'+ 
	    ('0' + (time.getMonth() + 1)).slice(-2) +'-'+
	    ('0' + time.getDate()).slice(-2);
	  var format = 
	    ("0" + time.getHours()).slice(-2)   + ":" + 
	    ("0" + time.getMinutes()).slice(-2) + ":" + 
	    ("0" + time.getSeconds()).slice(-2);
	  return date+' '+format;
	},
	addHours: function(t, h) {    
	   t.setTime(t.getTime() + (h*60*60*1000)); 
	   return t;   
	},
	getMongoObjectId: function(){
		return new ObjectId().toString();
	},
	gToken: function(n = 10){
		var rand = function() {
    		return Math.random().toString(36).substr(2);
		};

		return (rand()+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()
			+rand()+rand()+rand()+rand()+rand()+rand()+rand()).substr(0,n);
	},
	getUserType: function(ind){
		var UserType = [ 1,2,3,4 ];
		return typeof UserType[ind] == 'undefined' ? UserType : UserType[ind];
	},
	getResponses(c, data){
		var rt = {};
		responses.forEach((d, k) => {
			if(d.code == c){
				d.data = data;
				rt = d;
			}
		});
		return rt;
	},
	getCharCode: function(str){
		return str.getCharCode();
	},
	seperate: function(data){
		var $this = this;
		var rt = {UpcomingBooking: [],PastBooking: [], Cancelled: []};
		data.forEach((d, k) => {
			if(d.Status_ID == 5)
				rt.Cancelled.push(d);
			else if(d.Session_Time.From <= $this.current_time())
				rt.PastBooking.push(d);
			else
				rt.UpcomingBooking.push(d);
		});
		return rt;
	},
	MD5: function (string) {

	    function RotateLeft(lValue, iShiftBits) {
	        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
	    }

	    function AddUnsigned(lX,lY) {
	        var lX4,lY4,lX8,lY8,lResult;
	        lX8 = (lX & 0x80000000);
	        lY8 = (lY & 0x80000000);
	        lX4 = (lX & 0x40000000);
	        lY4 = (lY & 0x40000000);
	        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
	        if (lX4 & lY4) {
	            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
	        }
	        if (lX4 | lY4) {
	            if (lResult & 0x40000000) {
	                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
	            } else {
	                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
	            }
	        } else {
	            return (lResult ^ lX8 ^ lY8);
	        }
	    }

	    function F(x,y,z) { return (x & y) | ((~x) & z); }
	    function G(x,y,z) { return (x & z) | (y & (~z)); }
	    function H(x,y,z) { return (x ^ y ^ z); }
	    function I(x,y,z) { return (y ^ (x | (~z))); }

	    function FF(a,b,c,d,x,s,ac) {
	        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
	        return AddUnsigned(RotateLeft(a, s), b);
	    };

	    function GG(a,b,c,d,x,s,ac) {
	        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
	        return AddUnsigned(RotateLeft(a, s), b);
	    };

	    function HH(a,b,c,d,x,s,ac) {
	        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
	        return AddUnsigned(RotateLeft(a, s), b);
	    };

	    function II(a,b,c,d,x,s,ac) {
	        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
	        return AddUnsigned(RotateLeft(a, s), b);
	    };

	    function ConvertToWordArray(string) {
	        var lWordCount;
	        var lMessageLength = string.length;
	        var lNumberOfWords_temp1=lMessageLength + 8;
	        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
	        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
	        var lWordArray=Array(lNumberOfWords-1);
	        var lBytePosition = 0;
	        var lByteCount = 0;
	        while ( lByteCount < lMessageLength ) {
	            lWordCount = (lByteCount-(lByteCount % 4))/4;
	            lBytePosition = (lByteCount % 4)*8;
	            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
	            lByteCount++;
	        }
	        lWordCount = (lByteCount-(lByteCount % 4))/4;
	        lBytePosition = (lByteCount % 4)*8;
	        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
	        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
	        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
	        return lWordArray;
	    };

	    function WordToHex(lValue) {
	        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
	        for (lCount = 0;lCount<=3;lCount++) {
	            lByte = (lValue>>>(lCount*8)) & 255;
	            WordToHexValue_temp = "0" + lByte.toString(16);
	            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
	        }
	        return WordToHexValue;
	    };

	    function Utf8Encode(string) {
	        string = string.replace(/\r\n/g,"\n");
	        var utftext = "";

	        for (var n = 0; n < string.length; n++) {

	            var c = string.charCodeAt(n);

	            if (c < 128) {
	                utftext += String.fromCharCode(c);
	            }
	            else if((c > 127) && (c < 2048)) {
	                utftext += String.fromCharCode((c >> 6) | 192);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	            else {
	                utftext += String.fromCharCode((c >> 12) | 224);
	                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }

	        }

	        return utftext;
	    };

	    var x=Array();
	    var k,AA,BB,CC,DD,a,b,c,d;
	    var S11=7, S12=12, S13=17, S14=22;
	    var S21=5, S22=9 , S23=14, S24=20;
	    var S31=4, S32=11, S33=16, S34=23;
	    var S41=6, S42=10, S43=15, S44=21;

	    string = Utf8Encode(string);

	    x = ConvertToWordArray(string);

	    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

	    for (k=0;k<x.length;k+=16) {
	        AA=a; BB=b; CC=c; DD=d;
	        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
	        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
	        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
	        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
	        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
	        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
	        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
	        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
	        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
	        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
	        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
	        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
	        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
	        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
	        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
	        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
	        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
	        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
	        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
	        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
	        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
	        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
	        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
	        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
	        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
	        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
	        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
	        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
	        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
	        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
	        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
	        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
	        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
	        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
	        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
	        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
	        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
	        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
	        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
	        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
	        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
	        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
	        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
	        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
	        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
	        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
	        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
	        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
	        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
	        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
	        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
	        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
	        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
	        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
	        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
	        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
	        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
	        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
	        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
	        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
	        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
	        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
	        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
	        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
	        a=AddUnsigned(a,AA);
	        b=AddUnsigned(b,BB);
	        c=AddUnsigned(c,CC);
	        d=AddUnsigned(d,DD);
	    }

	    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

	    return temp.toLowerCase();
	}
};