const SERVER = !(process.execPath.includes("C:"));//process.env.PORT;
if (!SERVER){
  require("dotenv").config();
}

const ADMINCONSOLE = process.env.ADMINCONSOLE;

const CLIENT_ID = process.env.CLIENTID;
const CLIENT_SECRETE = process.env.CLIENTSECRETE;

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

const DEVELOPEMENT =  process.env.DEVELOPEMENT === "true" ? true : false;

const HEREAPI = process.env.HEREAPI;

const MONGOURI2 = process.env.MONGOURI2;
const MONGOPASSWORD = process.env.MONGOPASSWORD;
const MONGOUSER = process.env.MONGOUSER;

const MONGOTCS_USER = process.env.MONGOTCS_USER;
const MONGOTCS_PASS = process.env.MONGOTCS_PASS;

const DELETE_PASSWORD = process.env.DELETE_PASSWORD;
// const axios = require('axios');

const TRACKINGURL = process.env.TRACKINGURL;
const EXTRACTINGURL = process.env.EXTRACTINGURL ?? 'http://localhost:3055/extract/';
const LSTRACKINGURL = process.env.LSTRACKINGURL;


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
const jose = require('jose');
const ejs = require("ejs");
const papa = require("papaparse");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Excel = require('exceljs');
const formidable = require('formidable');
const multer = require('multer');
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// Configure app to user EJS and bodyParser
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(express.static(tempFilePath));
app.use(express.static("."));
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 2000000,
}));




/* ******** SETTING UP MTLTER   ********* */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to the temp folder
    cb(null, tempFilePath);
  },
  filename: function (req, file, cb) {
    // Generate unique file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance
const upload = multer({ storage: storage });




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
  verified: { type: Boolean, default: false },
  firstName: String,
  lastName: { type: String, default: "" },
  password: { type: String, default: "" },
  photoURL: String,
  userHasPassword: {
    type: Boolean,
    default: false
  },
  email: { type: String, default: "" },
  approvalNotes:[{description:String, adminEmail: { type: String, default: "" }, adminUsername:String, date:Date}],
  isProUser: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  renews: { type: Date, default: new Date() },
  usageCount: { type: Number, default: 0 },
});
userSchema.plugin(passportLocalMongoose);

const User = userConn.model("User", userSchema);




const contractorSchema = new mongoose.Schema({
  _id: String,
  driverNumber: String,
  name: String,
  phone: Number,
  link: String,
});

const Contractor = userConn.model("Contractor", contractorSchema);

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
  function(accessToken, refreshToken, profile, cb) {
    let userProfile = profile._json;
    // console.error(userProfile);
    // console.error("Logged In as: " + userProfile.email + "\n" + userProfile.family_name +"\n" +userProfile.given_name+
    // "\n" +userProfile.name+ "\n" + userProfile.picture);
    // console.error("\n");
    User.findOne({_id: userProfile.sub 
    }, function(err, user) {
      // console.log(err);
      // console.log(user);
      if (!err) {
        let oldUser = user;
        let newUser={};
        // console.error("userFound---->:");
        // console.error(user);
        // console.error("----->:\n");
        
        if (user) {
          if((!user.username) && userProfile.name){
            // console.error("user has no USERNAME on file");
            newUser.username = userProfile.name;
          }
          if((!user.lastName) && userProfile.family_name){
            // console.error("user has no LAST NAME on file");
            newUser.lastName = userProfile.family_name;
          }

          if((!user.firstName) && userProfile.given_name){
            // console.error("user has no FIRST NAME on file");
            newUser.firstName = userProfile.given_name;
          }

          if((!user.photoURL) && userProfile.picture){
            // console.error("user has no PHOTO on file");
            newUser.photoURL = userProfile.picture;
          }

          if(!user.email && userProfile.email){
            // console.error("user has no EMAIL on file");
            newUser.email = userProfile.email;
          }

          if(!user.isSuperAdmin && userProfile.isSuperAdmin){
            // console.error("user has no EMAIL on file");
            newUser.isSuperAdmin = userProfile.isSuperAdmin;
          }

          // console.error(user);
          // console.error(newUser);

          if(oldUser === newUser){
            console.error("OldUser is equals NewUser no need for update");
            if (user.verified) {
              return cb(null, user)
            } else {
              console.error("Logged in but Still Unauthorized");
              return cb(err);
            }
          }else{
              User.findOneAndUpdate({_id:user._id}, newUser, {new:true, upsert:true})
              .then(function(result) {
                // console.error(result);
                console.error(user.firstName + " - " + (user.email? user.email:user._id)+ " : User Updates ran Successfully");
                return cb(null, user);
              })
              .catch(function(err) {
                console.error("failed to create user");
                console.error(err);
            });
          }
        } else {
          console.error("user not found - creating new user");
          let newID; 
          let newUser;
          if(/^\d+$/.test(userProfile.sub)){
            newID = userProfile.sub;
              console.error("Creating user with a valid _ID");
              newUser = new User({
                _id: userProfile.sub,
                email: userProfile.email,
                username: userProfile.name,
                firstName: userProfile.given_name,
                lastName: userProfile.family_name,
                verified: false,
                isProUser: false,
                isSuperAdmin: false,
                photoURL: userProfile.picture
              });
          }else{
            console.error("Creating user w/o _ID");
            newUser = new User({
              email: userProfile.name,
              username: userProfile.given_name + " " + userProfile.family_name,
              firstName: userProfile.given_name,
              lastName: userProfile.family_name,
              verified: false,
              isProUser: false,
              isSuperAdmin: false,
              photoURL: userProfile.picture
            })
          }

          newUser.save()
            .then(function() {
              console.error("User Created Successfully");
              return cb(err);
            })
            .catch(function(err) {
              console.error("failed to create user");
              console.error(err);
          });
        }
      } else {
        console.error("Internal error");
        return cb(new Error(err))
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



const driverReportSchema = new mongoose.Schema({
    _id: String, // driverNumber-date
    date: {type:Date, default: new Date().setHours(0,0,0,0)},
    driverNumber: Number,
    driverName: String, 
    driverAllias: String, 
    manifest:[{
        brand: String,
        barcode: String,
        isPriority: Boolean,
        lastScan: String,
        Events: {type:[{}], default:null},
        name: String,
        street: String,
        city: String,
        state: String,
        country: String,
    }],
    lastUpdated: {type:Date, default:null},
});
const DriverReport = reportConn.model("DriverReport", driverReportSchema);
var driverReports;


const devDriverReportSchema = new mongoose.Schema({
    _id: String, // driverNumber-date
    date: {type:Date, default: new Date().setHours(0,0,0,0)},
    driverNumber: Number,
    driverName: String, 
    driverAllias: String, 
    manifest:[{
        brand: String,
        barcode: String,
        isPriority: Boolean,
        lastScan: String,
        Events: {type:[{}], default:null},
        name: String,
        street: String,
        city: String,
        state: String,
        country: String,
    }],
    lastUpdated: {type:Date, default:null},
});
const DevDriverReport = reportConn.model("DevDriverReport", devDriverReportSchema);
var devDriverReports;


const weeklyReportSchema = new mongoose.Schema({
    _id: String, // StartDate-EndDate
    startDate: {type:Date},
    endDate: {type:Date},
    drivers:[{
        driverNumber: Number,
        driverName: String,
        monday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        tuesday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        wednesday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        thursday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        friday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        saturday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
        sunday: { delivered:{type:Number, default:0},
                  driverAllias: {type:String, default:""},
                },
    }],
});
const WeeklyReport = reportConn.model("WeeklyReport", weeklyReportSchema);
var weeklyReport;



const statusSchema = new mongoose.Schema({
    operation: String, // driverNumber-date
    date: {type:Date, default: new Date().setHours(0,0,0,0)},
    done: {type:Boolean, default:false},
    startedBy: {type:String, default:""}, 
    lastUpdated: {type:Date, default: new Date()},
});
const Status = reportConn.model("Status", statusSchema);
var statusReport;



/***********************BUSINESS LOGIC ************************************/

app.route(APP_DIRECTORY + "/")
  .get(function (req, res) {
    // print(tempFilePath);
    if (req.isAuthenticated() || DEVELOPEMENT) {
      if((req.user? req.user.isProUser : null)){
        res.render("dashboard.ejs", {
          body: new Body("Dashboard", "", ""),
          user: (req.user)? req.user : null,
        });
      }else{
        res.redirect(APP_DIRECTORY + "/login");
      }
    } else {
      res.redirect(APP_DIRECTORY + "/login");
    }
  })

// 
/****************** Authentication *******************/
app.route(APP_DIRECTORY + "/login")
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      // console.log("Authenticated Request");
      res.redirect(APP_DIRECTORY + "/")
    } else {
      // console.log("Unauthorized Access, Please Login");
      res.render("login", {
        body: new Body("Login", "Access Denied", ""),
        login: null,
        user: req.user,
      });
    }
  })
  .post(function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      // console.log(req.body.password);
      // console.log(req.body.username);
      console.log("logged in as ---> " + user._id);
      // console.log(err);
      if (err) {
        return next(err);
      }
      // Redirect if it fails
      if (!user) {
        return res.render('login', {
          body: new Body("Login", info.message, ""),
          login: req.body.username,
          user: null,
        });
      }
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        // Redirect if it succeeds
        return res.redirect(APP_DIRECTORY + '/');
      });
    })(req, res, next);
  });

app.get(APP_DIRECTORY + '/auth/google', passport.authenticate('google', {
  // scope: ['profile']
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
}));

app.get(APP_DIRECTORY + '/auth/facebook', passport.authenticate('facebook', {
  scope: 'email'
})); 



app.route(APP_DIRECTORY + "/googleLoggedin")
  .get(function (req, res, next) {
    passport.authenticate('google', function (err, user, info) {
      if (err) {
        return next(err);
      }
      // Redirect if it fails
      if (!user) {
        return res.render('login', {
          body: new Body("Login", "", "Account Created successfully, Please log in again to continue"),
          login: null,
          user: req.user,
        });
      }
      req.logIn(user, function (err) {
        if (err) {
          return next(err);
        }
        // Redirect if it succeeds
        return res.render(APP_DIRECTORY + '/');
      });
    })(req, res, next);
  })
  .post(async function (req,res) {
    let claims = null;
    claims = jose.decodeJwt(req.body.credential)
    // console.log(claims);
    if(claims.iss == "https://accounts.google.com" && claims.email_verified){
        user = await User.findOne({_id:claims.sub});
        if(user){
          req.logIn(user, function (err) {
            if (err) {
              return res.render('login', {
                body: new Body("Login", "Unable to Login", ""),
                user: null,
              });
            }
            // Redirect if it succeeds
            if(user.isProUser){
              return res.redirect(APP_DIRECTORY + '/');
            }else{
              return res.render('login', {
                body: new Body("Login", "Unauthorized Access, Admin Priviledges are required to access the Dashboard", ""),
                user: null,
              });
            }
          });
        }else{
          console.error("No Such User");
          res.redirect(APP_DIRECTORY + "/login")    
        }
    }else{
      console.error("Fishy Login");
      res.redirect(APP_DIRECTORY + "/login")
    }
  })

app.route(APP_DIRECTORY + "/logout")
  .get(function (req, res) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect(APP_DIRECTORY + "/");
    });
  });

app.route(APP_DIRECTORY + "/register")
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      // console.log("Authenticated Request");
      res.redirect(APP_DIRECTORY + "/")
    } else {
      // console.log("Unauthorized Access, Please Login");
      res.render("register", {
        body: new Body("Register", "", ""),
        user: null,
      });
    }
  })
  .post(function (req, res) {
    const user = new User({
      _id: req.body.username,
      firstName: req.body.firstName,
      password: req.body.password,
      photoURL: "",
      userHasPassword: true,
    })
    let hahsPassword;
    // console.log(user.password);
    // console.log(req.body.confirmPassword);
    // console.log(user);
    if (user.password === req.body.confirmPassword) {
      bcrypt.hash(req.body.password, SALTROUNDS, function (err, hash) {
        if (!err) {
          user.password = hash;
          // console.log(user);
          User.exists({
            _id: user._id
          }, function (err, exists) {
            if (exists) {
              res.render("register", {
                body: new Body("Register", "email is aready in use", ""),
                user: user,
              });
            } else {

              user.save(function (err, savedObj) {
                // console.log(err);
                if (!err) {
                  // console.log(savedObj);
                  res.redirect(APP_DIRECTORY + "/login");
                } else {

                }
              })
            }
          });
        } else {
          // console.log(user);
          // console.log(err);
          res.render("register", {
            body: new Body("Register", "Unable to complete registration (error: e-PWD)", ""),
            user: user,
          });
        }
      });
    } else {
      res.render("register", {
        body: new Body("Register", "Passwords do not match", ""),
        user: user,
      });
    }
  })

app.route(APP_DIRECTORY + "/usernameExist")
  .post(function (req, res) {
    // console.log("username to search ---> "+req.body.username);
    User.exists({
      _id: req.body.username
    }, function (err, exists) {
      res.send(exists);
    })
  })

app.route(APP_DIRECTORY + "/deleteAccess")
  .get(function (req, res) {
    let provider = req.params.provider;
    if (provider === provider) {
      res.render("accessDeletion", {
        body: new Body("Delete Access", "", ""),
        user: req.user
      });
    }
  })
  .post(function (req, res) {
    User.deleteOne({
      _id: req.user.username
    }, function (err, deleted) {
      console.log(err);
      console.log(deleted);
      res.redirect(APP_DIRECTORY + "/logout")
    })
  })



app.route(APP_DIRECTORY + "/getClientUser")
.get(function (req, res) {
    if(req.isAuthenticated){
      res.send(req.user)
    }else{
      res.send(null)
    }
  })

/********** Handling Report Requests ***********/

app.route(APP_DIRECTORY + "/extractReport")
  .get(async function (req, res) {
    let url = EXTRACTINGURL;//'https://triumphcourier.com/mailreader/extract';
    https.get(url, function(response) {
      response.on("data", function(data) {
        console.log(data);
        const successfull = JSON.parse(data);
      });
    });
})

app.route(APP_DIRECTORY + "/checkExtractionStatus/:date")
  .get(async function(req,res) {
    let date = (new Date()).setHours(0,0,0,0);
    if(req.params.date){
      let paramDate = Number(req.params.date);
      if(paramDate)
      date = new Date(paramDate)
    }
    console.log(date);
    await Status.findOne({operation:"EMAIL_READER", date:(new Date(date).setHours(0,0,0,0))}).then(async function (foundStatus) {
      if(!foundStatus){
          res.send(true);
        }else{
          res.send(foundStatus.done);
        }
      })
  })

app.route(APP_DIRECTORY + "/saveDriverStatus")
  .post(async function (req, res) {
      //save reuest body object to database
      updatedDrivers = req.body.updatedDrivers;
      reportID = req.body.reportID;
      if(updatedDrivers.length > 0){
        // remove comment for successful save
        let result = await updateReportWithDrivers(reportID, updatedDrivers);
        console.error(result);
        res.send(result)
      }else{
        res.send({successfull:false, msg:"Report document with ID :'"+reportID+ "' does not Exist"})
      }
  })


  app.route(APP_DIRECTORY + "/saveIndividualDriverStatus")
  .post(async function (req, res) {
      //save reuest body object to database
      let driver = req.body.driver;
      // let oldDriver = await DriverReport.findOne({_id:driver._id}) //Main report flow, uncomment for actual
      let oldDriver = await DriverReport.findOne({_id:driver._id})
      let errors = [];

      if(oldDriver){
        // console.log('found oldDriver Report');
        for await (const stop of driver.manifest){
          if(stop.Events){
            oldStopIndex = oldDriver.manifest.findIndex(os => os.barcode === stop.barcode);
            if(oldStopIndex != -1){
              oldDriver.manifest[oldStopIndex].Events = stop.Events;
            }else{
              console.log("could not find stop index: driverDoc does not ave stop");
              errors.push({stop:stop, msg:'does not exist on server', err:"ERR_NOT_FOUND"});
            }
          }
        }
        try{
          oldDriver.lastUpdated = new Date();
          result = await oldDriver.save();
          if(result){
            res.send({successfull:true, msg:"updated single driver: "+driver.driverName})
          }else{
            res.send({successfull:false, msg:"Save Incomplete"})
          }
        }catch(err){
          console.error("Failed to perform save: "+driver.driverName);
          console.error(err);
          res.send({successfull:false, error:err, msg:"Failed to perform save: "+driver.driverName})
        }
      }else{
        console.log("Couldnt find old driver" + req.body.driver._id);
        res.send({successfull:false, error:"NOTFOUND", msg:"Querry with the ID Returned nothing: " + driver._id})
      }
  })

app.route(APP_DIRECTORY + "/getReport")
  .get(async function (req, res) {
    let today = await getToday();
    let report = await Report.find({_id:today},'-__v');
    res.send(report);
})

app.route(APP_DIRECTORY + "/getDriverReport")
  .get(async function (req, res) {
    
    let errors = [];
    let today = await getToday();
    // yesterday = new Date(today).setDate(3); // Remove before publshing - Fetches the previous days report
    // today = yesterday; // Remove before publshing - Fetches the previous days report
    console.error("getting Todays Report Automatically ", today);
  

    let report = await DriverReport.find({date:today},'-__v');
    

    if(report.length){
      res.send(report);
    }else{
      let drivers = [];
      let singleReport = await Report.find({_id:today},'-__v');
      if(singleReport.length){
        console.log("Converting found SingleReport...");
        singleReport = singleReport[0];
        // process and save to new database
          processingResult = await convertSingleReport(singleReport,{date:today}); 
          drivers = processingResult.drivers;
          errors = [...errors,...processingResult.errors]
          //send saved data to client
        if(drivers.length > 0){
            res.send(drivers);
            if(errors.length)
            console.error(errors);
        }else{
          res.send({error:errors, msg:"Error In Converting Single Report"});
        }
      }else{
        //send empty report if cant find from old and new database
        console.log("No SingleReports Either");
        res.send({error:"", msg:"Found Nothing, check old database"});
      }
    }
    
})

app.route(APP_DIRECTORY + "/getReport/:date")
  .get(async function (req, res) {
    let param = Number(req.params.date);
    let date = (new Date(param)).setHours(0,0,0,0);
    // console.log(param);
    // console.log(date);
    if(param){
      let report = await Report.find({_id:date},'-__v');
      res.send(report);
    }else{
      res.send({err:"Not Found", msg:"" + param});
    }
})

app.route(APP_DIRECTORY + "/getDriverReport/:date")
  .get(async function (req, res) {
    let param = Number(req.params.date);
    let date = (new Date(param)).setHours(0,0,0,0);
    let errors = [];
    console.error(outputDate()  , " getting REport based on specific date ", date);
    // console.log(param);
    // console.log(date);
    if(param){
      let report = await DriverReport.find({date:date},'-__v'); //this is the origianl report flow. 
      // let report = await DevDriverReport.find({date:date},'-__v');

      if(report.length){
        console.error(outputDate(), " Search for report data completed ")
        res.send(report);
      }else{
        // console.log('atempting to find past report in Development DB');
        // report = await DevDriverReport.find({_id:date},'-__v');
        // console.log("report from deve db: ", report.length);
        
        console.log('atempting to find past report in single DB');
        report = await Report.find({_id:date},'-__v');
        if(report.length){
            processingResult = await convertSingleReport(report[0],{date:date}); 
            drivers = processingResult.drivers;
            errors = [...errors,...processingResult.errors];
            if(drivers.length > 0){
              res.send(drivers);
              if(errors.length)
              console.error(errors);
          }else{
            res.send({error:errors, msg:"Error In Converting"});
          }
        }else{
          res.send({error:errors, msg:"Could not fin Old REport"});
        }
        
      }
    }else{
      res.send({err:"Not Found", msg:"",param});
    }
})


app.route(APP_DIRECTORY + "/getDriverFullReport/:driverNumber")
  .get(async function (req, res) {
    let driverNumber = Number(req.params.driverNumber);
    let errors = [];
    // console.log(param);
    // console.log(date);
    if(driverNumber){
      let report = await DriverReport.find({driverNumber:driverNumber},'-__v');
      if(report.length){
        res.send(report);
      }else{
        // console.log('atempting to find past report in Development DB');
        // report = await DevDriverReport.find({driverNumber:driverNumber},'-__v');
        // console.log("report from deve db: ", report.length);
        // if(report.length){
        //   res.send(report);
        // }else{
          res.send({err:"Not Found after all avenues", msg:"",driverNumber});
        // }
      }
    }else{
      res.send({err:"Not Found", msg:"",driverNumber});
    }
});

app.route(APP_DIRECTORY + "/getSingleDriverReport")
  .post(async function (req, res) {
    // console.log(req.body);
    let driverNumber = Number(req.body.driverNumber);
    let date = new Date(Number(req.body.date));
    let errors = [];
    if(driverNumber){
      let report = await DriverReport.findOne({driverNumber:driverNumber, date:date},'-__v');
      if(report){
        res.send(report);
      }else{
        // console.log('atempting to find past report in Development DB');
        // report = await DevDriverReport.findOne({driverNumber:driverNumber, date:date},'-__v');
        // console.log("report from deve db: ", report.length);
        // if(report){
          // res.send(report);
        // }else{
          res.send({err:"Not Found after all avenues", msg:"",driverNumber});
        // }
      }
    }else{
      res.send({err:"Not Found", msg:""+driverNumber+" - "+ date});
    }
});


app.route(APP_DIRECTORY + "/switchLoadStatus")
  .post(async function (req, res) {
    if(req.user){
      if(req.user.isProUser){
        let documentID = (req.body.documentID);
        let barcode = (req.body.barcode);
        let errors = [];
        // console.log(req.body);
        
          try {
            // Retrieve the MongoDB document by ID
            let report = await DriverReport.findOne({_id:documentID});
            // console.log(report);

            // Find the array item by ID
            const arrayItemIndex = report.manifest.findIndex(stop => stop.barcode === barcode);
            
            // console.log("\n\n");
            // console.log(arrayItemIndex);
            // console.log(report.manifest[arrayItemIndex]);
            if (arrayItemIndex !== -1) {
                // Update the property value
                report.manifest[arrayItemIndex].lastScan = 'Loaded';
                
                // Save the updated document
                await report.save();
                console.log('Document updated successfully.');
                res.send({successfull:true, err:"", msg:"Document updated successfully."});
            } else {
              console.log('Array item not found.');
              res.send({successfull:false, err:"Stop Not Found On Driver Manifest", msg:""});
            }
          } catch (error) {
              console.error('Error updating document:', error);
              res.send({successfull:false, err:"Error on Server Operation [ "+error+" ]", msg:""});
          }
          
        
      }else{
          res.send({successfull:false, err:"Admin Priviledge Needed for action", msg:""});
      }
    }else{
          res.send({successfull:false, err:"Unrecognised User", msg:""});
    }
});



/**** Deleting Reports **********/
app.route(APP_DIRECTORY + "/deleteDriverReport/:date/:deletePassword")
  .get(async function (req, res) {
    if(req.user.isSuperAdmin || (req.params.deletePassword == DELETE_PASSWORD)){
      let param = Number(req.params.date);
      let date = null;
      console.log(req.params.deletePassword == DELETE_PASSWORD);
      if(param != 0){
        date = (new Date(param)).setHours(0,0,0,0);
      }else{
        date = (new Date()).setHours(0,0,0,0);
      }
      let errors = [];
      // console.log(param);
      // console.log(date);
      if(date){
        await DriverReport.deleteMany({date:date}, (err,result) => {
          if (err) {
            console.error('Error deleting users:', err);
            res.send({successfull:false, err:err, msg:"Error deleting Reports"});
          } else {
            console.log(`Deleted ${result.deletedCount} reports.`);
            res.send({successfull:true, err:"", deletedCount:result.deletedCount, msg:'Deleted '+ result.deletedCount+ ' reports.'});
          }
        });  
      }else{
        res.send({err:"Invalid Argument", msg:"",param});
      }
    }else{
          res.send({successfull:false, err:"ADMIN_PRIVILEDGES_REQUIRED", msg:'Access Denied.'});
    }
})






/********** Weekly Reports *************/ 

app.route(APP_DIRECTORY + "/getWeeklyReport/:date")
  .get(async function (req, res) {
    let selectedDate = Number(req.params.date);
    if(isNaN(selectedDate)){
      selectedDate = new Date();
    }
    console.error("selectedDate: ", selectedDate);
    date = selectedDate;
    let startDate = (await getWeekDates(date))[0];
    console.error("Final StartDAte: ",startDate);
    try {
      let report = await WeeklyReport.findOne({startDate:startDate},'-__v');
      if(report){
        res.send(report);
      }else{
        console.log('Could find the report');
        res.send({msg: "No report found"});
      }      
    } catch (error) {
      console.error('Enountered an Error');
      console.error(error);
      res.send({msg: "Encountered an error", error:error});
    }
});

app.route(APP_DIRECTORY + "/getWeeklyReportRanges/")
  .get(async function (req, res) {
      
    try {
      let weeklyRanges = await WeeklyReport.find({},'-drivers -__v');
      if(weeklyRanges.length){
        res.send(weeklyRanges);
      }else{
        console.log('Could find the report');
        res.send({msg: "No report found"});
      }      
    } catch (error) {
      console.error('Enountered an Error');
      console.error(error);
      res.send({msg: "Encountered an error", error:error});
    }
});


app.route(APP_DIRECTORY + "/getDriverWeekReport")
  .post(async function (req, res) {
    let driverNumber = Number(req.body.driverNumber);
    let startDate = new Date(req.body.startDate);
    let endDate = new Date(req.body.endDate);
    let errors = [];
    if(driverNumber){
      let report = await DriverReport.find({driverNumber:driverNumber,$gte: startDate, $lte: endDate },'-__v');
      if(report.length){
        res.send(report);
      }else{
        console.log('attempting to find past report in Development DB');
        report = await DevDriverReport.find({driverNumber:driverNumber,$gte: startDate, $lte: endDate },'-__v');
        console.log("report from deve db: ", report.length);
        if(report.length){
          res.send(report);
        }else{
          res.send({err:"Not Found after all avenues", msg:"",driverNumber});
        }
      }
    }else{
      res.send({err:"Not Found", msg:"",driverNumber});
    }
})


app.route(APP_DIRECTORY + "/updateWeeklyReport")
  .post(async function (req, res) {
    let errors = [];
    let drivers = req.body.drivers;
    

    startDate = new Date(req.body.startDate)
    endDate = new Date ((await getWeekDates(startDate))[6]);
    day = req.body.day;

    
    console.log("updating weekly report");
    
    wr = await WeeklyReport.findOne({startDate:startDate});
    // console.log(wr);
    if(wr){
      for await (const driver of drivers){
        driverNumber = Number(driver.driverNumber);
        // console.log(driver.driverNumber);
        driverIndex =  wr.drivers.findIndex(d => d.driverNumber === driverNumber);
        // console.log("Driver Index: ",driverIndex);
        if(driverIndex != -1){
          wr.drivers[driverIndex][day].delivered = driver.delivered;
          wr.drivers[driverIndex][day].driverAllias = driver.driverAllias;
        }else{
          wr.drivers.push({
            driverNumber: driverNumber, 
            driverName:driver.driverName,
            [day]:{
              driverAllias:driver.driverAllias, 
              delivered:driver.delivered,
            }
          });
        }
      }
      try {
        saveResult = await wr.save()
        if(saveResult){
          console.log("Modified Successfully");
          res.send({msg:"WR Modified Successfully", startDate:startDate, updateDay:day,successfull:true})
        }else{
          console.log("Failed to save modified doc");
          res.send({msg:"Failed to save modified doc", startDate:startDate, updateDay:day,successfull:false})
        }
      } catch (error) {
        console.log("error saving WR after modification");
        res.send({msg:"error saving WR after modification", startDate:startDate, error:error, updateDay:day, successfull:true})
      }
    }else{
      console.log('wr does not exist, creating a new one');
      newWR = new WeeklyReport({
          _id: startDate, // StartDate-EndDate
          startDate: startDate,
          endDate: endDate,
          drivers:[],
      })

      for await (const driver of drivers){
        {
          newWR.drivers.push({
            driverNumber: Number(driver.driverNumber), 
            driverName:driver.driverName,
            [day]:{
              driverAllias:driver.driverAllias, 
              delivered:driver.delivered,
            }
          });
        }
      }
      try {
        saveResult = newWR.save()
        if(saveResult){
          console.log("WR updated and saved sucessfully");
          res.send({msg:"WR updated and saved sucessfully", startDate:startDate, updateDay:day,successfull:true})
        }else{
          console.log("New WR-doc failed to save");
          res.send({msg:"New WR-doc failed to save", startDate:startDate, updateDay:day,successfull:false})
        }
      } catch (error) {
        res.send({msg:"error saving WR after modification", startDate:startDate, updateDay:day, error:error, successfull:false})
        console.log("error saving WR after modification");
      }
    }

})







/****************** USER / EMPLOYEE CONTRACTORS OPERATIONS ***************** */
app.route(APP_DIRECTORY + "/getUsers")
  .get(async function (req, res) {
    if(req.isAuthenticated && req.user){
      if(req.user?.isProUser){
          let users = await User.find({},'-__v');
          console.log("Found ", users?.length, " users");
          res.send(users);
      }else{
        res.send({err:"ACCESS_DENIED", msg:"Admin Priviledge Required"})
      }
    }else{
      res.redirect(APP_DIRECTORY + "/login")
    }
})

app.route(APP_DIRECTORY+"/validateConsolePassword")
  .get(function(req, res) {
    res.send(false);
  })
  .post(function(req, res) {
    pass = req.body.password;
    if (pass === ADMINCONSOLE) {
      res.send(true);
    } else {
      res.send(false);
    }
  })

app.route(APP_DIRECTORY+"/verifyUser")
  .post(async function(req,res){
    errors = [];
    fails = [];
    let users = req.body.users;
    admin = req.user;
    if(admin && admin.isProUser){
      for await (user of users){
        var id = user._id; 
        await User.updateOne({_id:id}, { verified: true,  $push: { approvalNotes: {description:"Verified", adminUsername:admin.username, adminEmail:admin.email, date:new Date()} }},function(err,updated){
          if(!err){
            if(updated.n > 0){
              console.error("user verification Succesfull: ", id);
            }else{
              console.error("user verification FAILED: ", id);
              fails.push(user);
            }
          }else{
            errors.push(err);
          }
        })
      }
    }else{
      errors.push({err:"ACCESS DENIED", msg:"Admin Priviledge required"})
    }
      
    if(errors.length > 0){
      res.send({status:"done", err:errors, successfull: false, fails:fails})
    }else{
      res.send({status:"done", err:errors, successfull: true, fails:fails})
    }
  })

app.route(APP_DIRECTORY+"/restrictUser")
  .post(async function(req,res){

    errors = [];
    fails = [];
    let users = req.body.users;
    admin = req.user;
    if(admin && admin.isProUser){
      for await (user of users){
        let id = user._id;
        // console.error(id);
        await User.updateOne({_id:id}, { verified: false, $push: { approvalNotes: {description:"Restricted", adminUsername:admin.username, adminEmail:admin.email, date:new Date()} }},function(err,updated){
          if(!err){
            if(updated.n > 0){
              console.error("user restriction Succesfull: ", id);
            }else{
              console.error("user restriction FAILED: ", id);
              fails.push(user);
            }
          }else{
            errors.push(err);
          }
        })
      }
    }else{
      errors.push({err:"ACCESS DENIED", msg:"Admin Priviledge required"})
    }
      
    if(errors.length > 0){
      res.send({status:"done", err:errors, successfull: false, fails:fails})
    }else{
      res.send({status:"done", err:errors, successfull: true, fails:fails})
    }
  });

app.route(APP_DIRECTORY+"/makeProUser")
  .post(async function(req,res){
    
    errors = [];
    fails = [];
    let users = req.body.users;
    admin = req.user;
    
    if(admin && admin.isProUser){
      for await (user of users){
        let id = user._id;
        //console.error("");
        // console.error(id);
        await User.updateOne({_id:id}, { isProUser: true,  $push: { approvalNotes: {description:"Upgraded to ProUser", adminUsername:admin.username, adminEmail:admin.email, date:new Date()} } },function(err,updated){
          if(!err){
            if(updated.n > 0){
              console.error("ProUser Elevation Succesfull: ", id);
            }else{
              console.error("PRO User elevation FAILED: ", id);
              fails.push(user);
            }
          }else{
            errors.push(err);
          }
        })
      }
    }else{
      errors.push({err:"ACCESS DENIED", msg:"Admin Priviledge required"})
    }
      
    if(errors.length > 0){
      res.send({status:"done", err:errors, successfull: false, fails:fails})
    }else{
      res.send({status:"done", err:errors, successfull: true, fails:fails})
    }
  });

app.route(APP_DIRECTORY+"/revokeProUser")
  .post(async function(req,res){
    errors = [];
    fails = [];
    let users = req.body.users;
    admin = req.user;
    
    if(admin && admin.isProUser){
      for await (user of users){
        let id = user._id;
        //console.error("");
        // console.error(id);
        User.updateOne({_id:id}, { isProUser: false, $push: { approvalNotes: {description:"Revoked ProUser Priviledges", adminUsername:admin.username, adminEmail:admin.email, date:new Date()} } },function(err,updated){
          if(!err){
            if(updated.n > 0){
              console.error("ProUser Status revoked Succesfully: ", id);
            }else{
              console.error("PRO User revokking FAILED: ", id);
              fails.push(user);
            }
          }else{
            errors.push(err);
          }
        })
      }
    }else{
      errors.push({err:"ACCESS DENIED", msg:"Admin Priviledge required"})
    }
      
    if(errors.length > 0){
      res.send({status:"done", err:errors, successfull: false, fails:fails})
    }else{
      res.send({status:"done", err:errors, successfull: true, fails:fails})
    }    
  })

  app.route(APP_DIRECTORY+"/deleteUser")
  .post(async function(req,res){
    errors = [];
    fails = [];
    let users = req.body.users;
    admin = req.user;
    
    if(admin && admin.isProUser){
      for await (user of users){
        let id = user._id;
        //console.error("");
        // console.error(id);
        User.deleteOne({_id:id},function(err,deleted){
          // console.error(err);
          // console.error(deleted);
          if(!err){
            if(deleted.deletedCount > 0){
              console.error("User Deleted: ", id);
            }else{
            console.error("User Deletion FAILED: ", id);
            fails.push(user);
            }
          }else{
            errors.push(err);
          }
        })
      }
    }else{
      errors.push({err:"ACCESS DENIED", msg:"Admin Priviledge required"})
    }
      
    if(errors.length > 0){
      res.send({status:"done", err:errors, successfull: false, fails:fails})
    }else{
      res.send({status:"done", err:errors, successfull: true, fails:fails})
    }   
  })




/* *********  CONTRACTORS *********** */
app.route(APP_DIRECTORY + "/getContractors")
  .get(async function (req, res) {
    if(req.isAuthenticated && req.user){
      if(req.user?.isProUser){
          let contractors = await Contractor.find({},);
          console.log("Found ", contractors?.length, " Contractors");
          res.send(contractors);
      }else{
        res.send({err:"ACCESS_DENIED", msg:"Admin Priviledge Required"})
      }
    }else{
      res.redirect(APP_DIRECTORY + "/login")
    }
})



/******** Getting Resources  ********/ 
app.route(APP_DIRECTORY + "/getTURL")
  .get(function (req, res) {
    // console.error(outputDate() + " Hostname: "+req.hostname);
    // console.error("Developement: " + DEVELOPEMENT);
    // (req.isAuthenticated && req.hostname.includes("triumphcourier.com"))|| 
    if((req.isAuthenticated && req.hostname.includes("triumphcourier.com")) || DEVELOPEMENT){
      res.send(""+TRACKINGURL+"");
    }else{
      console.error("Tried to get Tracking URL from unauhtenticated/Unauthorized request");
      res.send("unauthorized request")
    }
})

app.route(APP_DIRECTORY + "/getLSURL")
  .get(function (req, res) {
    // console.error(outputDate() + " Hostname: "+req.hostname);
    // console.error("Developement: " + DEVELOPEMENT);
    // (req.isAuthenticated && req.hostname.includes("triumphcourier.com"))|| 
    if((req.isAuthenticated && req.hostname.includes("triumphcourier.com")) || DEVELOPEMENT){
      res.send(""+LSTRACKINGURL+"");
    }else{
      console.error("Tried to get Tracking URL from unauhtenticated/Unauthorized request");
      res.send("unauthorized request")
    }
})

app.route(APP_DIRECTORY + "/getExtractingURL")
  .get(function (req, res) {
    // console.error(outputDate() + " Hostname: "+req.hostname);
    // console.error("Developement: " + DEVELOPEMENT);
    // (req.isAuthenticated && req.hostname.includes("triumphcourier.com"))|| 
    if((req.isAuthenticated && req.hostname.includes("triumphcourier.com")) || DEVELOPEMENT){
      
      res.send(""+EXTRACTINGURL+"");
    }else{
      console.error("Tried to get Tracking URL from unauhtenticated/Unauthorized request");
      res.send("unauthorized request")
    }
})

app.route(APP_DIRECTORY + "/getPriorityBrands")
  .get(function (req, res) {
    res.send(priorityBrands);
})


app.route(APP_DIRECTORY + "/getDriverName/:driverNumber")
  .get(async function (req, res) {
    result = await getDriverName(req.params.driverNumber); 
    res.send(result);
})


app.route(APP_DIRECTORY + "/getContractorsList")
  .get(async function (req, res) {
    list = await Contractor.find({},"-__v");
    res.send(list);
})





try{
  app.listen(process.env.PORT || 3060, function () {
    // keepAlive();
    clearTempFolder();
    cacheBrands();
    // cacheReports();
    console.error(new Date().toLocaleString() + " >> Dashboard is live on port " + ((process.env.PORT) ? process.env.PORT : 3060));
  })
}catch(error ) {
    // Error case
    console.error('Error:', error);
}






/* ************ FILE OPERATIONS *************** */
//save file to temp folder
app.post(APP_DIRECTORY + "/contractorsListUpload", upload.single('contractorsList'), function (req, res) {
    if (req.isAuthenticated()) {
        let uploaded = req.file;

        getContractorsFromExcelDocument(uploaded.path).then(async function (data) {
          // console.log(data);
          if (data != "Error Getting Data" ){
              if(data.contractors.length > 0 ){
                let contractors = data.contractors;
                let errors = data.errors;
                // console.log(reportSummary);
                // console.log(report);
                console.log("Updating Contractors List ... ");
                // let newUpdates = [];
                // let newBrandsAdded = [];
                // let allBrandsFound = [];
                // var processedItem = 0;

                processContractorUpdates(contractors).then(result => {
                    // console.log(result);
                  res.send(result)
                }).catch(err => {
                  console.log(err);
                  res.send({err:err, errMsg:"FAILED_TO_PROCESS_UPDATE" })
                })
            }else{
              console.log("FAILED_TO_READ_FILE_DATA");
                res.send({err:err, errMsg:"FAILED_TO_READ_FILE_DATA", msg:"Failed to REad file, double check that you are uploadinig the right EXCELL Document." })
            }
          }     
        });
    }else{
      console.log("Unauthenticated Request");
      res.send({err:"UNAUTHENTICATED_REQUEST"})
    }
  });



/************ helper function ***************/
// prints all the files in the folder path supplied
async function print(path) {
  const dir = await fs.promises.opendir(path);
  for await (const dirent of dir) {
    console.log(dirent.name);
  }
}

// deletes a targeted download after 2mins
function deleteFile(path) {
  setTimeout(function () {
    fs.unlink(path, (err) => {
      if (err) {
        if (err.code == "ENOENT") {
          console.log("File Does not exist");
          return false;
        } else {
          console.log("Some other error: " + err.message);
          return false;
        }
      } else {
        console.log(path + ': was deleted');
        return true;
      }
    });
  }, (1000 * 60 * 1));
}

/* Promise that creates a copy of the Road warrior legacy file in the tempFiles folder for data manipulation
/* and returns the path of the tempfile (EXCEL) created */
function copyLegacyTemplate(tempFileName) {
  return new Promise(function (resolve, reject) {
    fs.copyFile('./original/new.xlsx', tempFilePath + tempFileName, function (err) {
      if (err) {
        console.log("unable to copy file");
        reject(null);
        throw err;
      }
    });
    resolve(tempFilePath + tempFileName);
  });
}

// promise that returns an array of JSON Addresses {customerName, address, apt(if any:ste,apt), city,state, country};
async function getData(filePath, options) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf8', function (err, data) {
      // console.log(options);
      if (!err) {
        // console.log(data);
        let parsedJSON = papa.parse(data);
        let arrayOfAddress = [];
        let errors = [];
        let totalRecords = 0;
        // console.log("get data says....");
        // console.log(parsedJSON);
        for (let i = 1; i < parsedJSON.data.length; i++) {
          totalRecords++;
          let jsonAddress = {};
          jsonAddress.Barcode = parsedJSON.data[i][0];
          let brand =  allBrands.filter( (foundBrand) => { return (foundBrand.trackingPrefixes.includes(jsonAddress.Barcode.substring(0,7))) })
          let brandName = (brand === undefined || brand.length == 0)? "## Unregistered Brand ##" : brand[0]._id 
          // console.log("*****");
          // console.log(options);
          // console.log(parsedJSON.data[i][1]);
          // console.log("*****");
          if (parsedJSON.data[i][1] === options.loaded || parsedJSON.data[i][1] === options.attempted || parsedJSON.data[i][1] === options.delivered) {
                tempSplitAddress = (parsedJSON.data[i][3] + "").split(".");
                let splitAddress;
                if (tempSplitAddress.includes(" US")) {
                  splitAddress = tempSplitAddress;
                } else {
                  tempSplitAddress.push(" US");
                  // console.log(tempSplitAddress);
                  splitAddress = tempSplitAddress;
                }
                // console.log(splitAddress.includes(" US"));
                // console.log(splitAddress);
                if (options.extractFor === "roadWarrior" || options.extractFor === "route4me") {
                  if (splitAddress.length > 5) {
                    let country = (splitAddress[5] + "").trim();
                    let countryProcessed = "";
                    let name = ((splitAddress[0] + "").trim()) ? splitAddress[0] : "N/A";
                    let street = (splitAddress[1] + "").trim() + ", " + (splitAddress[2] + "").trim();
                    let city = (splitAddress[3] + "").trim();
                    try{
                      if (country != "UNDEFINED") {
                        // var row = worksheet.getRow(i);
                        countryProcessed = (country.length > 3) ? country.split(" ")[0][0] + country.split(" ")[1][0] : country;
                        // let state = address.State.toUpperCase();
                        // row.getCell(2).value = address.Brand;
                        // row.getCell(1).value = address.Street + ", " + address.City + ", " + state + ", " + country;

                        // row.getCell(3).value = ;
                        // row.getCell(4).value = state;
                        // row.getCell(6).value = country;
                        // row.commit();
                        
                        // console.log(JSON.stringify(address));
                      }
                    }catch(error){
                      // console.log("errors where found at " + (i + 3));
                      errors.push({name:name, line: (i+1), fullAddress: street + " " +city});
                      // console.log(populateErrors);
                    }

                    jsonAddress = {
                      Brand: brandName,
                      Name: name,//((splitAddress[0] + "").trim()) ? splitAddress[0] : "N/A",
                      // apt:(splitAddress[1]+"").trim(),
                      Street: street,// (splitAddress[1] + "").trim() + ", " + (splitAddress[2] + "").trim(),
                      City: city, //(splitAddress[3] + "").trim(),
                      State: (splitAddress[4] + "").trim(),
                      Postal: "",
                      Country: countryProcessed,
                      // Country: (splitAddress[5] + "").trim(),
                      'Color (0-1)': "",
                      Phone: "",
                      Note: "",
                      Latitude: "",
                      Longitude: "",
                      'Service Time': "",
                    }
                  } else {
                    jsonAddress = {
                      Brand: brandName,
                      Name: ((splitAddress[0] + "").trim()) ? splitAddress[0] : "N/A",
                      Street: (splitAddress[1] + "").trim(),
                      City: (splitAddress[2] + "").trim(),
                      State: (splitAddress[3] + "").trim(),
                      Postal: "",
                      Country: (splitAddress[4] + "").trim(),
                      'Color (0-1)': "",
                      Phone: "",
                      Note: "",
                      Latitude: "",
                      Longitude: "",
                      'Service Time': "",

                    }
                  }
                }
                // console.log(jsonAddress);
                // if (jsonAddress.Name != "undefined" && jsonAddress.Name != " Unknown name") {
                  arrayOfAddress.push(jsonAddress);
                // }

                // console.log("Objects " + parsedJSON.data.length);
                
              // }
            
              
            // });  // end if brand finding
          } else {
            // console.log("already attempted/delivered");
          }
          
        } //end of for loop
        if (arrayOfAddress.length > 1) {
          // console.log("Data Processing Done . . . ");
          // console.log(arrayOfAddress);
          resolve({addresses: arrayOfAddress, errors: errors, totalRecords:totalRecords});
        } else {
          // console.log("Error getting data");  
          reject("Error Getting Data");
        }
        
        // }
      } else {
        console.log("something happened");
      }
    });
  });
}


// promise that returns an array of JSON Brands [{brandName, [tracking #1, tracking #1]}];
async function getContractorsFromExcelDocument(filePath) {
  return new Promise(async function (resolve, reject) {
    var data = {};
    var contractors = [];
    var errors = [];
    var report = {};
    var workbook = new Excel.Workbook();
    var totalRows = 0;

    await workbook.xlsx.readFile(filePath).then(async function () {
      var worksheet = workbook.getWorksheet(1);
      var headerRow = worksheet.getRow(1)
      var driverNumberCell;
      var driverNameCell;
      var phoneCell;

      await headerRow.eachCell(function(cell, colNumber) {
        
        if((cell.value).toLowerCase() === "contractor code"){
          driverNumberCell = colNumber
          // console.log("Found IC Cell : ", driverNumberCell );
        }
        
        if((cell.value).toLowerCase() === "name"){
          driverNameCell = colNumber
          // console.log("Name Cell : ", driverNameCell );
        }
        
        if((cell.value).toLowerCase() === "cell #"){
          phoneCell = colNumber
          // console.log("Found Phone column : ", phoneCell );
        }
      });
      

      let i = 2;
      let contractorCount = 0;
      totalRows = worksheet.rowCount;
      report.totalRead = totalRows;


      if(driverNumberCell && driverNameCell){
        await worksheet.eachRow(async function (row, rowNumber) {
          // console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
          if(rowNumber > 1){
            let driverNumber = row.getCell(driverNumberCell).value;
            let driverName = row.getCell(driverNameCell).value;
            let phone = await Number((row.getCell(phoneCell).value).replace(/[- ]/g, ''));
            
            if((driverName && driverNumber)){
              contractors.push(new Contractor({_id:driverNumber, driverNumber:driverNumber, name:driverName, phone:phone}));
            }else{
              errors.push({rowNumber: rowNumber, msg: 'missing vital details'});
            }
          }
        });
      }else{
        errors.push({err:"FAILED_TO_READ_HEADERS", msg:"Unable to determine Customer Columm or Barcode Columm"});
      }

    

      if (contractors.length) {
        resolve({contractors: contractors, errors: errors});
      } else {
        reject("Error Getting Data");
      }
    })
  });
}


function getDataForPrint(filePath, options) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, 'utf8', function (err, data) {
      // console.log(options);
      if (!err) {
        // console.log(data);
        let parsedJSON = papa.parse(data);
        let arrayOfAddress = [];
        for (let i = 1; i < parsedJSON.data.length; i++) {
          let jsonAddress;
          if (parsedJSON.data[i][1] === options.loaded || parsedJSON.data[i][1] === options.attempted) {
            // console.log(parsedJSON.data[i][1]);
            // console.log(options);
            tempSplitAddress = (parsedJSON.data[i][3] + "").split(".");
            let splitAddress;
            if (tempSplitAddress.includes(" US")) {
              splitAddress = tempSplitAddress;
            } else {
              tempSplitAddress.push(" US");
              // console.log(tempSplitAddress);
              splitAddress = tempSplitAddress;
            }
            // console.log(splitAddress.includes(" US"));
            // console.log(splitAddress);

            if (splitAddress.length > 5) {
              jsonAddress = {
                Name: ((splitAddress[0] + "").trim()) ? splitAddress[0] : "N/A",
                // apt:(splitAddress[1]+"").trim(),
                Street: (splitAddress[2] + "").trim() + ", " + (splitAddress[1] + "").trim(),
                City: (splitAddress[3] + "").trim(),
                State: (splitAddress[4] + "").trim(),
                Barcode: parsedJSON.data[i][0].trim()
              }
            } else {

              jsonAddress = {
                Name: ((splitAddress[0] + "").trim()) ? splitAddress[0] : "N/A",
                Street: (splitAddress[1] + "").trim(),
                City: (splitAddress[2] + "").trim(),
                State: (splitAddress[3] + "").trim(),
                Barcode: parsedJSON.data[i][0].trim()

              }
            }
            // console.log(jsonAddress.Name);
            if (jsonAddress.Name != "undefined" && jsonAddress.Name != " Unknown name") {
              arrayOfAddress.push(jsonAddress);
            }
          } else {
            // console.log("already attempted/delivered");
          }
        }

        if (arrayOfAddress) {
          console.log("Data Processing Done . . . ");
          // console.log(arrayOfAddress);
          resolve(arrayOfAddress);
        } else {
          reject("Error Getting Data");
        }
      } else {
        console.log("something happened");
      }
    });
  });
}


function populateExcelData(fileName, addresses) {
  return new Promise(function (resolve, reject) {

    var workbook = new Excel.Workbook();

    workbook.xlsx.readFile("original/legacy.xlsx").then(function () {
      var worksheet = workbook.getWorksheet(1);
      let i = 2;
      for (address of addresses) {
        let country = address.Country.toUpperCase();
        // console.log("countr: " + country);
        if (country != "UNDEFINED") {
          country = (country.length > 3) ? country.split(" ")[0][0] + country.split(" ")[1][0] : country;
          let state = address.State.toUpperCase();
          var row = worksheet.getRow(i);
          row.getCell(1).value = address.Name;
          row.getCell(2).value = address.Street;
          row.getCell(3).value = address.City;
          row.getCell(4).value = state;
          row.getCell(6).value = country;
          row.getCell(9).value = address.Brand;
          row.commit();
          i++;
          // console.log(JSON.stringify(address));
        }
      }
      fs.mkdir(tempFilePath, (err) => {
        if (err) {
          // console.log(err.message);
          // console.log(err.code);
          if (err.code === "EEXIST") {
            console.log("Directory ALREADY Exists.");
            resolve(workbook.xlsx.writeFile(tempFilePath + fileName));
          } else {
            reject(err.code);
            throw err;
          }
        }else{
          console.log("" + tempFilePath + " Directory was created.");
          resolve(workbook.xlsx.writeFile(tempFilePath + fileName));
        }
      });
      // return workbook.xlsx.writeFile(tempFilePath + "legacyNew.xlsx");
    })
  });
}


async function populateExcelDataRoute4Me(fileName, addresses) {
  return new Promise(function (resolve,reject){
  
    var workbook = new Excel.Workbook();
    let populateErrors = [];
    workbook.xlsx.readFile("original/r4me-original.xlsx").then(function () {
      var worksheet = workbook.getWorksheet(1);
      let i = 2;
      let e = 3;
      for (address of addresses) {
        let country = address.Country.toUpperCase();
        // console.log("country: " + country);
        // console.log(address.Name);
        try{
          if (country != "UNDEFINED") {
            var row = worksheet.getRow(i);
            country = (country.length > 3) ? country.split(" ")[0][0] + country.split(" ")[1][0] : country;
            let state = address.State.toUpperCase();
            row.getCell(2).value = address.Brand;
            row.getCell(1).value = address.Street + ", " + address.City + ", " + state + ", " + country;

            // row.getCell(3).value = ;
            // row.getCell(4).value = state;
            // row.getCell(6).value = country;
            row.commit();
            
            // console.log(JSON.stringify(address));
          }
        }catch(error){
          console.log("errors where found at " + (i + 3));
          populateErrors.push({name:address.Name, line: (e), fullAddress: address.street + "" + address.city});
          console.log(populateErrors);
        }
        i++;
        e++;
      }

      fs.mkdir(tempFilePath, (err) => {
        if (err) {
          // console.log(err.message);
          // console.log(err.code);
          if (err.code === "EEXIST") {
            console.log("Directory ALREADY Exists.");
            workbook.xlsx.writeFile(tempFilePath + fileName); 
            // console.log(populateErrors);
            resolve(populateErrors);
          } else {
            throw err;
            reject(err.code)
          }
        }else{
          console.log("'/tmp' Directory was created.");
          workbook.xlsx.writeFile(tempFilePath + fileName);
          // console.log(populateErrors);
          resolve(populateErrors);
        }
      });
      // return workbook.xlsx.writeFile(tempFilePath + "legacyNew.xlsx");
    })

  });
  
}


function populateExcelDataForPrint(fileName, addresses, userName) {
  var workbook = new Excel.Workbook();

  workbook.xlsx.readFile("original/print.xlsx").then(function () {
    var worksheet = workbook.getWorksheet(1);
    var row = worksheet.getRow(1);
    row.getCell(2).value = userName;
    row.getCell(5).value = "Packages: " + addresses.length;
    row.commit();
    let i = 3;
    for (address of addresses) {
      if (address.Barcode != "UNDEFINED") {
        let state = address.State.toUpperCase();
        var row = worksheet.getRow(i);
        row.getCell(1).value = address.Name;
        row.getCell(2).value = address.Street;
        row.getCell(3).value = address.City;
        row.getCell(4).value = state;
        row.getCell(5).value = address.Barcode;
        row.commit();
        i++;
        // console.log(JSON.stringify(address));
      }
    }
    fs.mkdir("./tmp", (err) => {
      if (err) {
        // console.log(err.message);
        // console.log(err.code);
        if (err.code === "EEXIST") {
          console.log("Directory ALREADY Exists.");
          return workbook.xlsx.writeFile(tempFilePath + fileName);
        } else {
          throw err;
        }
      }
      console.log("'/tmp' Directory was created.");
      return workbook.xlsx.writeFile(tempFilePath + fileName);
    });
    // return workbook.xlsx.writeFile(tempFilePath + "legacyNew.xlsx");
  })
}

async function cacheBrands(){
  try{
    allBrands = await Brand.find({},"-__v");
  }catch (error){
    console.log(outputDate() , " Failed to Load Online Brands");
  }


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
                console.log(outputDate() + "Brands cached and ready");
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
      if(file.startsWith("R4M") || file.startsWith("RW") || file.startsWith("contractorsList") || file.startsWith("brands.txt")){
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

async function processContractorUpdates(contractors){
  return new Promise(async (resolve,reject) => {
    await Contractor.deleteMany({}).then(function (result) {
      console.log(result);

      //save the list of contractors here
      Contractor.insertMany(contractors)
        .then((docs) => {
          console.log('Documents saved successfully');
          resolve({msg:'Documents Updated', docs:docs})
        })
        .catch((error) => {
          console.error({msg:'Error saving documents:', error:"FAILED_TO_SAVE_NEW_DOCS\n", err:error});
          reject({msg:'Error saving documents:', error:"FAILED_TO_SAVE_NEW_DOCS\n", err:error})
        });
        
      }).catch((err) => {
        console.log("Error occureled while deleteing");
        reject({msg:'Error saving documents:', error:"FAILED_TO_DELETE_OLD_DOCS\n", err:err})
      });
  })
}


async function processBrandUpdates(brands){
  return new Promise((resolve,reject) => {
    
    newBrands = [];
    modifiedBrands = [];

    brands.forEach(brand => {
    
     // put a promis that will call mongo db and check for exists before returnning to continue

      checkIfBrandExist(brand).then(function(exists) {
        // console.log("BrandFOund: ");
        // console.log(existResult);
        if(!exists){
          addBrand(brand).then( (x) =>{
            newBrands.push({_id: x._id, trackingPrefix: x.trackingPrefixes});
            console.log("Successsfully Added Brand");
            console.log(brand);
            // console.log(x);
            // resolve(x);
          }).catch((err) => {
            console.log("Failed to add Brand");
            console.log(err.message);
            // resolve(err);
          })
        }else{
          updateBrand(brand).then((updatedBrand) => {
            modifiedBrands.push({_id: updatedBrand._id, trackingPrefix: updatedBrand.updatedBrand});
            console.log(updatedBrand);
            // res.send(updatedBrand);
          }).catch(err =>{
            console.log(err);
            // resolve(err);
          })
        }
      }).catch((err)=> {
        //add non existent brand and then continue
        console.log("***");
        console.log(err.message);
        reject(err.message);
      });
      
    });
    console.log("Done Processing....pushing back to main thread");
    resolve({modifiedBrands: modifiedBrands, newBrands:newBrands});
  })
}


async function checkIfBrandExist(brand){
  return new Promise(function(resolve, reject){
    Brand.exists({_id:brand._id}, async function (err,exists) {
      if(!err){
        // console.log("Exists function");
        // console.log(exists);
        resolve(exists);
        
      }else{
        reject({description: "Failed to Check if document exists", message:"EEXISTSFAILED"})
      }
    });
  })
}


async function addBrand(brand) {
  return new Promise(function (resolve, reject) {
    
    // console.log(brand);

    // console.log("Attempting Adding Brand");
    const newBrand = new Brand(brand);
    newBrand.save(function(err,savedDoc){
      if(!err){
        // console.log(savedDoc);
        // console.log(newBrand._id+" saved succeffully");
        resolve(savedDoc);
      }else{
          // console.log("Failed to Save Brand");
          // console.log(err.message);
          // console.log("err.code");
          // console.log(err.code);
          reject(err)
      }
    });

    // console.log("Brand Already Exists Checking and Updating for Tracking Prefixes");

  });
}


async function updateBrand(brand) {
  return new Promise(function (resolve, reject) {
    
    // console.log("Brand Already Exists Checking and Updating for Tracking Prefixes");
    Brand.updateOne(
      { _id: brand._id },
      { $addToSet: { trackingPrefixes: { $each: brand.trackingPrefixes } } },
      function (err,updatedBrand) {
        // console.log(err);
        if(!err){
          if(updatedBrand.nModified > 0){
            // console.log("Brand");
            // console.log(brand);
            // console.log("Updated Brand");
            // console.log(updatedBrand);
            console.log(brand._id+" Modified succeffully");
            resolve(brand);
          }else{
            reject("ENOPREFIX");
            // console.log("No new Prefixes to be added");
          }
        }else{
          console.log("Brand Update Failed");
          console.log(err);
          reject("EFAILEDTOUPDATE")
        }
      }
    )

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
    return {successfull:true, updatedDoc:updatedDoc, msg:"Driver Report updated Succesfully"}
  } catch (error) {
    console.error('Error:', error);
  }
}


async function convertSingleReport(singleReport,opts) {
  let today = opts ? opts.date : await getToday();
  let drivers = [];
  let errors = [];
  for await(const driver of singleReport.drivers){
    let driverDocManifest = [];
    for await (const stop of driver.manifest){
      let newStop = {
        brand: stop.brand,
        barcode: stop.barcode,
        lastScan: stop.lastScan,
        Events: stop.Events,
        name: stop.name,
        street: stop.street,
        city: stop.city,
        state: stop.state,
        country: stop.country,
      }
      if(!stop.isPriority){
        newStop.isPriority = await isPriority(stop.brand);
        // console.log("assigned Ispriority: ", stop.isPriority);
      }
      // console.log("adding stop with a priority: ", newStop.isPriority);
      driverDocManifest.push(newStop);
    }
    let driverDoc = new DriverReport({
        _id: driver.driverNumber + "-" + today, // driverNumber-date
        date: today,
        driverNumber: driver.driverNumber, 
        driverName: await getDriverName(driver.driverNumber), 
        driverAllias: "N/A", 
        manifest:driverDocManifest,
        lastUpdated: singleReport.lastUpdated,
    });
    let saveResult = await driverDoc.save();
    if(saveResult){
      drivers.push(driverDoc);
    }else{
      errors.push(driverDoc)
    }
  }
  if(drivers.length > 0){
    return {drivers:drivers, errors:errors};
  }else{
    return {errors:errors, drivers:drivers};
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



async function isPriority(brandName) {
  if(priorityBrands != null){
    result = await priorityBrands.some(p => (p.name).toLowerCase() == (brandName).toLowerCase());
    return result;
  }else{
    console.log("Unable to Check for Priority");
    return false;
  }
}

async function getDriverName(driverNumber){
    driver = await Contractor.findOne({_id:driverNumber});
    driverNumberStr = "" + driverNumber;
    return (driver ?  driver.name : "***" + driverNumberStr.substring(3));
}

async function getWeekDates(randomDate) {
  let date = randomDate ?? new Date();
  const weekDates = [];
  const currentDate = new Date(date);

  // Find the first day (Sunday) of the week for the given date
  if(currentDate.getDay() !== 6){
    currentDate.setDate(currentDate.getDate() - (currentDate.getDay() +1));  
  }
  
  // Subtract 7 days to go back to the first day of the previous week
  // currentDate.setDate(currentDate.getDate() - 7);


  // Iterate through the days of the week and push them to the weekDates array
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() + i);
    weekDates.push(day);
  }

  return weekDates;
}

const priorityBrands = [
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
  { trackingPrefixes : [], name : 'THE PURPLE CARROT'}, 
  { trackingPrefixes : [], name : 'THRIVE MARKET'}, 
  { trackingPrefixes : [], name : 'ADP (MC-Payroll)'}, 
  { trackingPrefixes : [], name : 'Payroll (MC-Payroll)'}, 
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
  { driverNumber : '269640', name : 'Jesus CONTRERAS QUINTERO'},
  { driverNumber : '271385', name : 'Kiara MADDEN'},
  { driverNumber : '271386', name : 'Morris BRATTS'},
  { driverNumber : '271388', name : 'Ronald TORRES BACALAO'},
  { driverNumber : '271464', name : 'Blondy MEDINA'},
  { driverNumber : '271670', name : 'Eliana CORREA MORENO'},
  { driverNumber : '271881', name : 'Joe CEBALLOS'},
  { driverNumber : '272105', name : 'Sadan SYLLA'},
  { driverNumber : '272246', name : 'Angela MOSLEY'},
  { driverNumber : '272595', name : 'Maykelin PEROZO'},
  { driverNumber : '272612', name : 'Shiquita JAMES'},
  { driverNumber : '272883', name : 'Briana HARPER'},
  { driverNumber : '272950', name : 'Tiffany SWANSON'},
  { driverNumber : '273294', name : 'Salena CARTER'},
  { driverNumber : '273985', name : 'Diana PRIETO'},
  { driverNumber : '275899', name : 'Kariela ANEZ ARAUJO'},
  { driverNumber : '277229', name : 'Charles PARKS'},
  { driverNumber : '277253', name : 'Claudancy COEUR'},
  { driverNumber : '278482', name : 'Shekinah DAVIS'},
  { driverNumber : '279195', name : 'Reginald SMITH'},
  { driverNumber : '280413', name : 'Ninozka ZABALA'},
  { driverNumber : '280445', name : 'Danny PRIESTER'},
  { driverNumber : '281963', name : 'Garion SLAYTON'},
  { driverNumber : '282304', name : 'Gabriela Bellorin VILLARROEL'},
  { driverNumber : '283000', name : 'Roxana FINOL DEPABLOS'},
]