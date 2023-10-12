const SERVER = !(process.execPath.includes("C:"));//process.env.PORT;
if (!SERVER){
  require("dotenv").config();
}


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
const jose = require('jose');
const ejs = require("ejs");
const papa = require("papaparse");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Excel = require('exceljs');
const formidable = require('formidable');
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


// Configure app to user EJS abd bodyParser
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
  verified: { type: Boolean, default: false },
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
        res.render("login", {
          body: new Body("Login", "UnAuthorized Access", ""),
          login: null,
          user: req.user,
        });
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
        body: new Body("Login", "", ""),
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
        return res.redirect(APP_DIRECTORY + '/');
      });
    })(req, res, next);
  })
  .post(async function (req,res) {
    let claims = null;
    claims = jose.decodeJwt(req.body.credential)
    console.log(claims);
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
            return res.redirect(APP_DIRECTORY + '/');
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




/* Handling Report Requests */
app.route(APP_DIRECTORY + "/extractReport")
  .get(async function (req, res) {
    let url = 'https://triumphcourier.com/mailreader/extract';
    
    https.get(url, function(response) {
      response.on("data", function(data) {
        console.log(data);
        const successfull = JSON.parse(data);
      });
    });
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


app.route(APP_DIRECTORY + "/getReport")
  .get(async function (req, res) {
    let today = await getToday();
    let report = await Report.find({_id:today},'-__v');
    res.send(report);
})


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

app.route(APP_DIRECTORY + "/getPriorityBrands")
  .get(function (req, res) {
    res.send(priorityBrands);
})


app.route(APP_DIRECTORY + "/getDriverName/:driverNumber")
  .get(function (req, res) {
    driver = (contractors.filter((c) => c.driverNumber === req.params.driverNumber))[0];
    res.send(driver);
})



// app.route(APP_DIRECTORY + "/error")
//   .get(async function (req, res) {
//     throwFalseError();
//     res.send("error thrown! did you get it?");
// })





/***************** Handling Payments  ********************/
app.post(APP_DIRECTORY + '/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/canceled.html',
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});


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
function getBrandsFromExcelDocument(filePath) {
  return new Promise(function (resolve, reject) {
    var data = {};
    // var allbrands = [];
    var brands = [];
    var report = [];
    reportSummary = {};
    var workbook = new Excel.Workbook();
    var totalRows = 0;

    workbook.xlsx.readFile(filePath).then(function () {
      var worksheet = workbook.getWorksheet(1);
      var headerRow = worksheet.getRow(1)
      var customerCell;
      var barcodeCell;

      headerRow.eachCell(function(cell, colNumber) {
        if((cell.value).toLowerCase() === "customer"){
          customerCell = colNumber
        }

        if((cell.value).toLowerCase() === "barcode"){
          barcodeCell = colNumber
        }
        
      });
      
      // console.log('Barcode Cell is:  ' + barcodeCell + ' ||  Customer Cell is:  ' + customerCell);

      let i = 2;
      let brandCount = 0;
      totalRows = worksheet.rowCount;
      reportSummary.totalRead = totalRows;


    if(barcodeCell && customerCell){
      worksheet.eachRow(function (row, rowNumber) {
        // console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
        let tracking = row.getCell(barcodeCell) + "";
        let trackingPrefix = tracking.substring(0,7);
        let brandName = row.getCell(customerCell) + "";
        // let searchResult = brands.filter(function(b) { return b.brandName === brandName; });
        let searchResult = allBrands.find(e => e._id === brandName);
        // console.log(brandName +" -- "+ trackingPrefix);
        
        if (searchResult) {
          var includesTrackingPrefix = searchResult.trackingPrefixes.includes(trackingPrefix);
          if(!includesTrackingPrefix){
            searchResult.trackingPrefixes.push(trackingPrefix);
            brands.push(searchResult);
            report.push({brand: brandName, tracking: trackingPrefix, action: "~ New Prefix"});
            console.log("new prefix for "+brandName+"  --> '"+ trackingPrefix +"' added for data Collection");
          }
        }else{
          // console.log(".... FOUND NEW BRAND ...")
          brands.push({_id: brandName, trackingPrefixes:[trackingPrefix]});
          report.push({brand: brandName, tracking: trackingPrefix, action: "+ New Brand"});
          brandCount++;
          // console.log(searchResult);
          // console.log("brands array length => " + searchResult.length);
          // console.log("Searched Brand Includes Tracking? " +brands[brandCount].trackingPrefix.includes(tracking));
          // console.log("Searched Brand Includes TrackingPrefix? " +brands[brandCount].trackingPrefix.includes(trackingPrefix));
        }
      });
    }else{
      reject("Unable to determine Customer Columm or Barcode Columm");
    }

      

      if (brands) {
        reportSummary.totalBrands = brands.length;
        // console.log("Data Processing Done . . . ");
        // console.log("BrandCounter = " + brandCount);
        // console.log("Total Rows Read: " + totalRows);
        // console.log("New Brands = " + brands.length);

        // console.log("Will Not RESOLVE GetBrands from Excell -- developmenet + ");
        resolve({brands: brands, report: report, reportSummary});
        
        // res.redirect(APP_DIRECTORY + "/brandsUpload")
      } else {
        // res.redirect(APP_DIRECTORY + "/")
        // console.log("Total Brand Count = " + brandCount);
        // console.log("Wont REJECT either GetBrands from Excell -- developmenet + ");
        reject("Error Getting Data");
      }

      i++;
      // console.log(JSON.stringify(address));



      // return workbook.xlsx.writeFile(tempFilePath + "legacyNew.xlsx");
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

// http://localhost:3025/routingAssistanttmp/RW_-_Tue_Jun_13_2023_19-24_ejerenwaavis@gmail.com.xlsx

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