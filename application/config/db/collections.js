var common = require('../../public/common.js');
var collection = {};
collection.createUserCollection = function(db, cb) {
   db.createCollection("user", {
      validator: {
         $jsonSchema: {
            bsonType: "object",
            required: [ "First_Name", "Mobile_Number", "Email_Id", "User_Type" ],
            properties: {
               First_Name: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               Mobile_Number: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               Email_Id: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               User_Type: {
                  bsonType: "number",/* 1=superAdmin,2=admin,3=labour,4=customer*/
                  description: "can only be one of the enum values and is required"
               }
            }
         }
      }
   }, (err, collection) => {
      cb();
   });
};

collection.createBookingCollection = function(db, cb) {
   db.createCollection("booking", {
      validator: {
         $jsonSchema: {
            bsonType: "object",
            required: [ "ID", "User_ID", "Locality_ID", "Address", "Service_Type_ID", "Status_ID", "Payment_Status", "Session_Time.From","Session_Time.To" ],
            properties: {
               ID: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               User_ID: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               Locality_ID: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               Address: {
                  bsonType: "string",
                  description: "must be string and is required"
               },
               Service_Type_ID: {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               Status_ID: {
                  bsonType: "number",
                  description: "must be a number and is required"
               },
               Payment_Status: {
                  enum: [ 0,1,2,3 ],/*0=pending,1=success,2=cancel,3=failed*/
                  description: "can only be one of the enum values and is required"
               },
               "Session_Time.From" : {
                  bsonType: "string",
                  description: "must be a string and is required"
               },
               "Session_Time.To" : {
                  bsonType: "string",
                  description: "must be a string and is required"
               }
            }
         }
      }
   }, (err, collection) => {
      cb();
   });
};

collection.createStatusCollection = function(db, cb) {
   db.createCollection("status", {
      validator: {
         $jsonSchema: {
            bsonType: "object",
            required: [ "name" ],
            properties: {
               name: {
                  bsonType: "string",
                  description: "must be a string and is required"
               }
            }
         }
      }
   }, (err, collection) => {
      cb();
   });
};

collection.createLocalityCollection = function(db, cb) {
   db.createCollection("locality", {
      validator: {
         $jsonSchema: {
            bsonType: "object",
            required: [ "name" ],
            properties: {
               name: {
                  bsonType: "string",
                  description: "must be a string and is required"
               }
            }
         }
      }
   }, (err, collection) => {
      cb();
   });
};

collection.createServiceCollection = function(db, cb) {
   db.createCollection("service_type", {
      validator: {
         $jsonSchema: {
            bsonType: "object",
            required: [ "name" ],
            properties: {
               name: {
                  bsonType: "string",
                  description: "must be a string and is required"
               }
            }
         }
      }
   }, (err, collection) => {
      cb();
   });
}

const statusData = [
   {_id: 0, name: 'New'},
   {_id: 1, name: 'Processing'},
   {_id: 2, name: 'Request Assigned'},
   {_id: 3, name: 'Work In-Progress'},
   {_id: 4, name: 'Completed'},
   {_id: 5, name: 'Cancelled'}
];

var fullHouseCleaning_id = common.getMongoObjectId();
const service_typeData = [
   { _id : fullHouseCleaning_id, name : "Full House cleaning", amount: '200.00' },
   { _id : common.getMongoObjectId(), name : "Kitchen Cleaning", parent : [ fullHouseCleaning_id ], amount: '200.00' },
   { _id : common.getMongoObjectId(), name : "Bathroom Cleaning", parent : [ fullHouseCleaning_id ], amount: '200.00' },
   { _id : common.getMongoObjectId(), name : "Carpet Cleaning", parent : [ fullHouseCleaning_id ], amount: '200.00' },
   { _id : common.getMongoObjectId(), name : "Sofa Cleaning", parent : [ fullHouseCleaning_id ], amount: '200.00' },
   { _id : common.getMongoObjectId(), name : "Marble Polishing", parent : [ ], amount: '200.00' }
];

const localityData = [
   {_id: common.getMongoObjectId(), name: "Ashok Nagar"},
   {_id: common.getMongoObjectId(), name: "Vadapalani"},
   {_id: common.getMongoObjectId(), name: "Valasaravakkam"},
   {_id: common.getMongoObjectId(), name: "Saligramam"},
   {_id: common.getMongoObjectId(), name: "KK Nagar"},
   {_id: common.getMongoObjectId(), name: "Velachery"},
   {_id: common.getMongoObjectId(), name: "Guindy"},
   {_id: common.getMongoObjectId(), name: "Alandhur"}
];

var dummyAdmin = {
   _id: common.getMongoObjectId(),
   First_Name: 'Madras Ninja',
   Mobile_Number: '1234567890',
   Email_Id: 'madrasninja@gmail.com',
   User_Type: 0
};

collection.settingsData = {
   "title" : "Madras Ninja",
   "smtp_config" : { 
      "host" : "smtp.gmail.com",
      "port" : 465, "secure" : true,
      "auth" : {
         "user" : "smix.1234890@gmail.com",
         "pass" : "1234.Smix" 
      } 
   } 
};

collection.initRecords = function(db,){
   db.insert('user', dummyAdmin, (err, result) => {
      db.insert('status', statusData, (err, result) => {
         db.insert('service_type', service_typeData, (err, result) => {
            db.insert('locality', localityData, (err, result) => {});
         });
      });
   });
}

module.exports = collection;

