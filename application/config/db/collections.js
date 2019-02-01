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
               enum: [ 0,1,2,3 ],/* 0=superAdmin,1=admin,2=labour,3=customer*/
               description: "can only be one of the enum values and is required"
            }
         }
      }
   }
})


db.createCollection("booking", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: [ "User_ID", "Locality_ID", "Service_Type_ID", "Status_ID", "Payment_Status", "Session_Time.From","Session_Time.To" ],
         properties: {
            User_ID: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            Locality_ID: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            Service_Type_ID: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            Status_ID: {
               bsonType: "string",
               description: "must be a string and is required"
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
})

db.createCollection("status", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: [ "name","ID" ],
         properties: {
            name: {
               bsonType: "string",
               description: "must be a string and is required"
            }
         },
         properties: {
            ID: {
               bsonType: "number",
               description: "must be a numeric and is required"
            }
         }
      }
   }
})

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
})

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
})

const statusData = [
   {ID: 0, name: 'New'},
   {ID: 1, name: 'Processing'},
   {ID: 2, name: 'Request Assigned'},
   {ID: 3, name: 'Work In-Progress'},
   {ID: 4, name: 'Completed'}
];

const service_typeData = [
   {name: 'Full House cleaning'},
   {name: 'Kitchen Cleaning'},
   {name: 'Restroom Cleaning'},
   {name: 'Carpet Cleaning'},
   {name: 'Sofa Cleaning'},
   {name: 'Marble Polishing'}
];

const localityData = [];