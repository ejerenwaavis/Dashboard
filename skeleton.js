const SERVER = !(process.execPath.includes("C:"));//process.env.PORT;
if (!SERVER){
  require("dotenv").config();
}


const CLIENT_ID = process.env.CLIENTID;
const CLIENT_SECRETE = process.env.CLIENTSECRETE;

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

const DEVELOPEMENT = process.env.DEVELOPEMENT

const HEREAPI = process.env.HEREAPI;

const MONGOURI2 = process.env.MONGOURI2;
const MONGOPASSWORD = process.env.MONGOPASSWORD;
const MONGOUSER = process.env.MONGOUSER;

const MONGOTCS_USER = process.env.MONGOTCS_USER;
const MONGOTCS_PASS = process.env.MONGOTCS_PASS;

// const axios = require('axios');
const TRACKINGURL = process.env.TRACKINGURL;


const REPORTS_DB = process.env.REPORTS_DB;
const USERS_DB = process.env.USERS_DB;



const SALTROUNDS = 10;
const SECRETE = process.env.SECRETE;
const STRIPEAPI = process.env.STRIPEAPI;

const APP_DIRECTORY = !(SERVER) ? "" : ((process.env.APP_DIRECTORY) ? (process.env.APP_DIRECTORY) : "");
const PUBLIC_FOLDER = (SERVER) ? "./" : "../";
const PUBLIC_FILES = process.env.PUBLIC_FILES;
const TEMP_FILEPATH = (process.env.TEMP_FILEPATH ? process.env.TEMP_FILEPATH : 'tmp/');


const tempFilePath = TEMP_FILEPATH;
// var populateErrors = [];


const express = require("express");
const app = express();
const ejs = require("ejs");
const papa = require("papaparse");
const bodyParser = require("body-parser");
const fs = require("fs");
// const fsp = require('fs/promises');
const path = require("path");
const Excel = require('exceljs');
const formidable = require('formidable');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');
const stripe = require("stripe")(STRIPEAPI);

const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// Configure app to user EJS abd bodyParser
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(tempFilePath));
app.use(express.static("."));
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 2000000,
}));


/******************** Authentication Setup & Config *************/
//Authentication & Session Management Config
app.use(session({
  secret: SECRETE,
  resave: false,
  saveUninitialized: false,

}));
app.use(passport.initialize());
app.use(passport.session());

// Mongoose Configuration and Setup
const usersDB = "mongodb+srv://" + MONGOUSER + ":" + MONGOPASSWORD + USERS_DB;
const brandsDB = "mongodb+srv://" + MONGOUSER + ":" + MONGOPASSWORD + MONGOURI2;
const reportsDB = "mongodb+srv://" + MONGOTCS_USER + ":" + MONGOTCS_PASS + REPORTS_DB;


mongoose.set("useCreateIndex", true);

const brandConn = mongoose.createConnection(brandsDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const brandSchema = new mongoose.Schema({
  _id: String,
  trackingPrefixes: [String], //array of variants of the tracking prefixes
});

const Brand = brandConn.model("Brand", brandSchema);
var allBrands;




const userConn = mongoose.createConnection(usersDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const userSchema = new mongoose.Schema({
  _id: String,
  username: String,
  firstName: String,
  lastName: { type: String, default: "" },
  password: { type: String, default: "" },
  photoURL: String,
  userHasPassword: {
    type: Boolean,
    default: false
  },
  
  verified: { status: Boolean, default: false,
  approvalNotes:[{description:String, adminUsername:String, date:Date}]
  },
  isProUser: { type: Boolean, default: false },
  renews: { type: Date, default: new Date() },
  usageCount: { type: Number, default: 0 },
});
userSchema.plugin(passportLocalMongoose);

const User = userConn.model("User", userSchema);

/********* Configure Passport **************/
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

//telling passprt to use local Strategy


//telling passport to use Facebook Strategy

//telling passport to use GoogleStrategy
passport.use(new GoogleStrategy({
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRETE,
  callbackURL: (SERVER) ? "https://triumphcourier.com"+ APP_DIRECTORY+"/googleLoggedin" : APP_DIRECTORY + "/googleLoggedin",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function (accessToken, refreshToken, profile, cb) {
    let userProfile = profile._json;
    // console.log(userProfile);
    User.findOne({
      _id: userProfile.email
    }, function (err, user) {
      if (!err) {
        // console.log("logged in");
        if (user) {
          console.log("Logged in as ----> " + user._id);
          return cb(null, user)
        } else {
          console.log("user not found - creating new user");
          let newUser = new User({
            _id: userProfile.email,
            username: userProfile.email,
            firstName: userProfile.given_name,
            lastName: userProfile.family_name,
            photoURL: userProfile.picture
          });

          newUser.save()
            .then(function () {
              return cb(null, user);
            })
            .catch(function (err) {
              console.log("failed to create user");
              console.log(err);
              return cb(new Error(err));
            });
        }
      } else {
        console.log("***********Internal error*************");
        console.log(err);
        return cb(new Error(err));
      }
    });
  }
));

// Mongoose Report DB Connection Setup
const reportConn = mongoose.createConnection(reportsDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const reportSchema = new mongoose.Schema({
    _id: Date,
    date: {type:Date, default: new Date()},
    drivers:[{
        driverNumber: Number, 
        manifest:[{
            brand: String,
            barcode: String,
            lastScan: String,
            Events: {type:{}, default:null},
            name: String,
            street: String,
            city: String,
            state: String,
            country: String,
        }]
    }],
    lastUpdated: {type:Date, default:null},
});
const Report = reportConn.model("Report", reportSchema);
var reports;







/***********************BUSINESS LOGIC ************************************/

app.route(APP_DIRECTORY + "/")
  .get(function (req, res) {
    // print(tempFilePath);
    if (req.isAuthenticated() || DEVELOPEMENT) {
      res.render("dashboard.ejs", {
        body: new Body("Dashboard", "", ""),
        user: (req.user)? req.user : null,
      });
    } else {
      res.redirect(APP_DIRECTORY + "/login");
    }
  })




  app.route(APP_DIRECTORY + "/saveDriverStatus")
  .post(async function (req, res) {
      //save reuest body object to database
      updatedDrivers = req.body.updatedDrivers;
      reportID = req.body.reportID;
      if(updatedDrivers.length > 0){
        let result = await updateReportWithDrivers(reportID, updatedDrivers);
        console.error(result);
        res.send(result)
      }else{
        res.send({successfull:false, msg:"Report document with ID :'"+reportID+ "' does not Exist"})
      }
  })


app.route(APP_DIRECTORY + "/getReport")
  .get(async function (req, res) {
    let today = await getToday();
    let report = await Report.find({_id:today},'-__v');
    res.send(report);
})

app.route(APP_DIRECTORY + "/getTrackingResource")
  .get(function (req, res) {
    // console.error(outputDate() + " Hostname: "+req.hostname);
    if((req.isAuthenticated && req.hostname.includes("triumphcourier.com"))|| DEVELOPEMENT){
      res.send(TRACKINGURL)
    }else{
      res.send("unauthorized request")
    }
})

app.route(APP_DIRECTORY + "/getPriorityBrands")
  .get(function (req, res) {
    res.send(priorityBrands);
})


app.route(APP_DIRECTORY + "/getDriverName/:driverNumber")
  .get(function (req, res) {
    driver = (contractors.filter((c) => c.driverNumber === req.params.driverNumber))[0];
    res.send(driver);
})

try{
  app.listen(process.env.PORT || 3060, function () {
    keepAlive();
    clearTempFolder();
    cacheBrands();
    cacheReports();
    console.error(new Date().toLocaleString() + " >> Dashboard is live on port " + ((process.env.PORT) ? process.env.PORT : 3060));
  })
}catch(error ) {
    // Error case
    console.error('Error:', error);
}






// HELPERS

async function cacheBrands(){
  allBrands = await Brand.find({},"-__v");
  stringBrands = JSON.stringify(allBrands);
  // reCon = JSON.parse(stringBrands);
  // console.log(reCon);

  fs.mkdir(tempFilePath, (err) => {
      if (err) {
        // console.log(err.message);
        // console.log(err.code);
        if (err.code === "EEXIST") {
          if(SERVER)
          console.error("Directory ALREADY Exists.");
           fs.writeFile(tempFilePath + 'brands.txt', stringBrands, err => {
              if (err) {
                console.error(err);
              }else{
                if(SERVER) 
                console.log("Brands written to file");
            }
          }); 
        } else {
          console.error(err.code);;
          console.error(err);;
        }
      }else{
        fs.writeFile(tempFilePath + 'brands.txt', stringBrands, err => {
          if (err) {
            console.error(err);
          }else{
            console.log("Brands written to file");
          }
        }); 
        console.log("'/tmp' Directory was created.");
      }
    });
 
}

async function clearTempFolder(){
  fs.readdir(tempFilePath, (err, files) => {
  if (err) {
    console.error(err.code + " Failed to clear temp folder");
  }else{
    // console.error(files);
    for (const file of files) {
      if(file.startsWith("R4M") || file.startsWith("RW") || file.startsWith("brands.txt")){
        fs.unlink(path.join(tempFilePath, file), (err) => {
          if (err) throw err; 
        });
      }
    }
  }
});
}

async function cacheReports(){
  let today = (new Date()).setHours(0,0,0,0);
  reports = await Report.find({_id:today},"-__v");
  stringReport = JSON.stringify(reports);
  // reCon = JSON.parse(stringRoutes);
  // console.log(reCon);
  fs.mkdir(tempFilePath, (err) => {
      if (err) {
        // console.log(err.message);
        // console.log(err.code);
        if (err.code === "EEXIST") {
          if(SERVER) 
          console.error("Directory ALREADY Exists.");
           fs.writeFile(tempFilePath + 'reports.txt', stringReport, err => {
              if (err) {
                console.error(err);
              }else{
                if(SERVER) 
                console.error("Reports written to file");
              }
            }); 
        } else {
          console.error(err.code);;
          console.error(err);;
        }
      }else{
        fs.writeFile(tempFilePath + 'reports.txt', stringRoutes, err => {
          if (err) {
            console.error(err);
          }else{
            console.log("Reports written to file");
          }
        }); 
        console.log("'/tmp' Directory was created.");
      }
    });
}



async function updateReportWithDrivers(id, updatedDrivers) {
  try {
    // Find the document by its _id
    const docToUpdate = await Report.findById(id);

    if (!docToUpdate) {
      console.error('Document not found');
      return {successfull:false, msg:"Document not found"}
    }

    // Modify the document with the updated data
    docToUpdate.drivers = updatedDrivers;
    docToUpdate.lastUpdated = new Date();

    // Save the updated document
    const updatedDoc = await docToUpdate.save();
    // console.error('Driver Report updated:', updatedDoc);
    return {successfull:true, updatedDoc:updatedDoc, msg:"Drivers Report updated Succesfully"}
  } catch (error) {
    console.error('Error:', error);
  }
}

function getToday(){
  return (new Date()).setHours(0,0,0,0);
}

function Body(title, error, message) {
  this.title = title;
  this.error = error;
  this.message = message;
  this.domain = APP_DIRECTORY;
  this.publicFolder = PUBLIC_FOLDER;
  this.publicFiles = PUBLIC_FILES;
}

function throwFalseError() {
  throw new Error("just for cause --- attempt to restart in 5seconds")
}

async function keepAlive(){
  interval = 3600000;
  count = 1;
  console.error(outputDate()+"Keep Alive Service Initiated, [Interval: "+ interval/60000+" mins]");
  startDate = new Date(2023,10,03);
  while (startDate.getDate() < 5) {
    console.log(outputDate() + "Keep Alive Ping: " + count++);
    await new Promise( function(resolve,reject){
      setTimeout(resolve, interval)//1hr
    });
  }
}

function outputDate() {
  return (new Date().toLocaleString()) + " >> ";
}


priorityBrands = [
  { trackingPrefixes : [], name : 'Eat Clean To Go'},
  { trackingPrefixes : [], name : 'Coldcart, Inc.'},
  { trackingPrefixes : [], name : 'Grip Shipping Inc'},
  { trackingPrefixes : [], name : 'WILD ALASKAN, INC.'},
  { trackingPrefixes : [], name : 'DAILY HARVEST'},
  { trackingPrefixes : [], name : "The Farmer's Dog, Inc."},
  { trackingPrefixes : [], name : 'Butcherbox'},
  { trackingPrefixes : [], name : 'Zara'},
  { trackingPrefixes : [], name : 'Zara Home'}, 
  { trackingPrefixes : [], name : 'SUN BASKET'}, 
  { trackingPrefixes : [], name : 'GOBBLE INC'}, 
  { trackingPrefixes : [], name : 'WALMART'}, 
  { trackingPrefixes : [], name : 'CORPORATE PAYROLL SERVICES'}, 
  { trackingPrefixes : [], name : 'PAYCHEX'}, 
  { trackingPrefixes : [], name : 'ADP'}, 
  { trackingPrefixes : [], name : 'eGourmet Solutions Inc.'}, 
]


contractors = [
  { driverNumber : '203593', name : 'Frankie ROBINSON'},
  { driverNumber : '219029', name : 'Andreea OKONTA'},
  { driverNumber : '227410', name : 'Yacouba NABE'},
  { driverNumber : '230161', name : 'Jones MOORE'},
  { driverNumber : '236765', name : 'Kenya SAMUELS'},
  { driverNumber : '250660', name : 'Susan TAYLOR'},
  { driverNumber : '253249', name : 'Christopher RUFFING'},
  { driverNumber : '253799', name : 'Nestor PUENTES'},
  { driverNumber : '253800', name : 'Mauricio MARULANDA'}, 
  { driverNumber : '255305', name : 'Ana BAZA PAJAROS'},
  { driverNumber : '256956', name : 'Avis EJERENWA'},
  { driverNumber : '257085', name : 'Michael MCKEEVER'},
  { driverNumber : '257137', name : 'Laray KING'},
  { driverNumber : '257275', name : 'Freddy LOZANO'},
  { driverNumber : '257329', name : 'Christopher TAYLOR'},
  { driverNumber : '257398', name : 'Edwin BARHAM'},
  { driverNumber : '257553', name : 'Anthony JACKSON'},
  { driverNumber : '257596', name : 'Joseph JONES'},
  { driverNumber : '257697', name : 'Jonathan GHOLSON'},
  { driverNumber : '258743', name : 'Maria LOZANO'},
  { driverNumber : '258823', name : 'Destiny SMITH'},
  { driverNumber : '258852', name : 'Brenda CANAS MEJIA'},
  { driverNumber : '258828', name : 'Emerald SHEARER'},
  { driverNumber : '258986', name : 'Damon ILER'},
  { driverNumber : '259013', name : 'Jhon PALACIO TINTINAGO'},
  { driverNumber : '259016', name : 'Latasha PALMER'},
  { driverNumber : '259027', name : 'Jorge GUTIERREZ'},
  { driverNumber : '259257', name : 'Lenora TAYLOR'},
  { driverNumber : '259353', name : 'Jessica TAPIA'},
  { driverNumber : '259755', name : 'Lennys CENTENO CORDOVA'},
  { driverNumber : '259908', name : 'Cornealius WHITFIELD'},
  { driverNumber : '259945', name : 'Damien ROBINSON'},
  { driverNumber : '260582', name : 'Natalie ILDEFONSO DIAZ'},
  { driverNumber : '260066', name : 'Mark SEARCY'},
  { driverNumber : '260616', name : 'Marquez JOHNSON'},
  { driverNumber : '260708', name : 'Daiana SERNA SANCHEZ'},
  { driverNumber : '260729', name : 'Antonio REDDING'},
  { driverNumber : '260748', name : 'Timothy BURNS'},
  { driverNumber : '260749', name : 'Malik DAY'},
  { driverNumber : '261126', name : 'Nestor ENRIQUE URDANETA'},
  { driverNumber : '261456', name : 'Jawaun MOSES'},
  { driverNumber : '261486', name : 'Enos MULLINGS'},
  { driverNumber : '261767', name : 'Gia TAYLOR'},
  { driverNumber : '262479', name : 'Shamira LEE JUAREZ'},
  { driverNumber : '262862', name : 'Jamilah TURNER'},
  { driverNumber : '262863', name : 'Keema BRIDGEWATER'},
  { driverNumber : '262942', name : 'Anterio BATEMAN'},
  { driverNumber : '263152', name : 'Maria DUQUE VELEZ'},
  { driverNumber : '263388', name : 'Willie MURRELL JR'},
  { driverNumber : '262946', name : 'Dominique WATSON'},
  { driverNumber : '263442', name : 'Cynthia TORRES'},
  { driverNumber : '263461', name : 'Adina JONES'},
  { driverNumber : '264337', name : 'Annette GAMBLE'},
  { driverNumber : '263976', name : 'Delonte WRIGHT'},
  { driverNumber : '264483', name : 'Philip MADISON'},
  { driverNumber : '264576', name : 'Steven MOTIERAM'},
  { driverNumber : '264505', name : 'Sheafra HAMMETT'},
  { driverNumber : '264774', name : 'Al BAKER'},
  { driverNumber : '264886', name : 'Lionel CAVE'},
  { driverNumber : '264821', name : 'Derick SMITH'},
  { driverNumber : '265078', name : 'Jasmine COGGINS'},
  { driverNumber : '265122', name : 'Cynthia COLLINS'},
  { driverNumber : '265151', name : 'Keisa SULLIVAN'},
  { driverNumber : '265165', name : 'Darrell LAKE JR'},
  { driverNumber : '265219', name : 'Akeem ALCOTT'},
  { driverNumber : '265265', name : 'Brittany SUMLER'},
  { driverNumber : '265289', name : 'Patrick WILLIAMS'},
  { driverNumber : '265400', name : 'John-Thomas GARNER'},
  { driverNumber : '265598', name : 'Moro DIALLO'},
  { driverNumber : '265750', name : 'Sandra MARIN LOZANO'},
  { driverNumber : '265777', name : 'Tyquan WILLIAMS'},
  { driverNumber : '266049', name : 'Michael HAUSER'},
  { driverNumber : '266687', name : 'Kimicion BROWN'},
  { driverNumber : '266122', name : 'Edwin THURANIRA'},
  { driverNumber : '266822', name : 'Ilyas ZOUHEIR'},
  { driverNumber : '267199', name : 'Isemelda JOSEPH DURACIN'},
  { driverNumber : '268645', name : 'Freddy MURILLO'},
  { driverNumber : '268717', name : 'Reshonnah HARVEY'},
  { driverNumber : '268845', name : 'Christian GALVEZ'},
  { driverNumber : '269487', name : 'Justin MCCALLA'},
  { driverNumber : '269640', name : 'Jesus CONTRERAS QUINTERO'}
]