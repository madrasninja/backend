var ObjectId = require('mongodb').ObjectId;
module.exports = {
	uniqueid: function() {
		  function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		  }
		  return s4();
	},
	getMongoObjectId: function(){
		return new ObjectId().toString();
	}
};