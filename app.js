//jshint esversion:8
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let User = require("./models/user");
let Item = require("./models/item");
let Order = require("./models/order");
let Torder = require("./models/torder");
let Category = require("./models/category");
let dotenv = require("dotenv");
dotenv.config();
let Joi = require("@hapi/joi");
let methodOverride = require("method-override");
const {registerValidation, loginValidation} = require("./validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verify = require("./verifytoken");
const { requireAuth, checkUser, isAdmin } = require('./middleware/authMiddleware');
const cookieParser = require('cookie-parser');
const slugify = require("slugify");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
let async = require("async");
let nodemailer = require("nodemailer");
let flash = require("connect-flash");

let PORT = process.env.PORT || 4000;

//const mongoURI = "mongodb://Localhost:27017/newdb";

const mongoURI = process.env.MONGODB_URL;

mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
const conn = mongoose.connection;
let gfs;

conn.once("open", () =>{
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("okay");
});

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({storage});


app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(express.static("uploads"));
app.use(flash());
app.use(methodOverride("_method"));


app.set("view engine", "ejs");


app.use(require("express-session")({
  secret: "Okay",
  resave: false,
  saveUninitialized: false
}));


const maxAge = 3 * 24 * 60 * 60;


app.use(function(req, res, next){
  res.locals.user = req.session.user;
  next();
});


app.get("/", function(req, res){
  res.render("landing", {user:User.findById(req.params.id)});
});

//seller profile
app.get("/seller", requireAuth, function(req, res){
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
      } else {
        User.findById(decodedToken._id, function(err, user){
           if(err){
             console.log(err);
           } else {
             res.render("seller/seller", {seller: user});
           }
         });
    }});}
});


app.get("/seller/:id/settings", requireAuth, checkUser, function(req, res){
  User.findById(req.params.id, function(err, user){
     if(err){
       console.log(err);
     } else {
       res.render("seller/settings", {seller: user});
     }
   });
});


app.put("/seller/:id/settings", requireAuth, checkUser, function(req, res){
  User.findByIdAndUpdate(req.params.id, req.body, function(err, updatedProfile){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/");
    }
  });
});


app.get("/seller/:id/payment", requireAuth, checkUser, function(req, res){
  User.findById(req.params.id, function(err, user){
     if(err){
       console.log(err);
     } else {
       res.render("seller/payment", {seller: user});
     }
   });
});


app.put("/seller/:id/payment", requireAuth, checkUser, function(req, res){
  User.findByIdAndUpdate(req.params.id, req.body, function(err, updatedProfile){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/");
    }
  });
});


app.get("/item/:id/new", requireAuth, checkUser, function(req, res){
  User.findById(req.params.id, function(err, user){
    if(err){
      console.log(err);
    } else {
      Category.find({}, function(err, allcategories){
        if(err){
          console.log(err);
        } else {
          res.render("items/new", {user:user, category: allcategories});
        }
      });
    }
  });
});


//adding item to DB
app.post("/items/:id", requireAuth, checkUser, upload.single("file"), function(req, res){
  console.log(req.file);
  User.findById(req.params.id, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/item/:id/new");
    } else {
      let newItem = new Item({name: req.body.name,
        image: req.file.filename,
        price: req.body.price,
        seller: user.username,
        sellerMobile: user.mobile,
        sellerName: user.name,
        sellerId: req.params.id,
        quantity: req.body.quantity,
        description: req.body.description,
        material: req.body.material,
        weight: req.body.weight,
        sellerAddline1: user.addline1,
        sellerAddline2: user.addline2,
        sellerCity: user.city,
        sellerZipcode: user.zipcode,
        sellerState: user.state,
        sellerCountry: user.country});
      //create an item object with image filename
      Item.create(newItem, function(err, item){
        if(err){
          console.log(err);
        } else {
          User.findById(req.params.id, function(err, user){
            if(err){
              console.log(err);
            } else {
              Category.findOne({name:req.body.category}, function(err, catt){
                if(err){
                  console.log(err);
                } else {

                  if(catt){
                  item.category = req.body.category;
                  item.save();
                  catt.items.push(item);
                  catt.save();}
                }
              });
            }
          });
          user.items.push(item);
          user.save();
          console.log("pdpfsdpf" + item);
          res.redirect("/seller");
        }
      });
    }
  });
});


app.get("/image/:filename", function(req, res){
  gfs.files.findOne({filename: req.params.filename}, function(err, file){
    if(err){
      console.log(err);
    } else {
      const readstream = gfs.createReadStream(file.filename);
      console.log("sada"+ file.filename);
      readstream.pipe(res);
    }
  });
});


//created items
app.get("/seller/:id/items", checkUser, function(req, res){
  User.findById(req.params.id).populate("items").exec(function(err, foundItem){
    if(err){
      console.log(err);
    } else {
      console.log(foundItem);
      res.render("items/items", {item: foundItem});
    }
  });
});


app.get("/seller/:id/items/:item_id/edit", checkUser, function(req, res) {
  Item.findById(req.params.item_id, function(err, foundReview){
    if(err){
      console.log(err);
    } else {
      Category.find({}, function(err, allcategories){
        if(err){
          console.log(err);
        } else {
      res.render("items/edit", {seller_id: req.params.id, item: foundReview, category: allcategories});
    }
  });
    }
  });
});


app.put("/seller/:id/items/:item_id/", checkUser, function(req, res){
  Category.findOne({name:req.body.category}, function(err, catt){
  Item.findByIdAndUpdate(req.params.item_id, {name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    material: req.body.material,
    weight: req.body.weight,
    quantity: req.body.quantity}, function(err, updatedItem){
    if(err){
      res.redirect("back");
    } else {
      updatedItem.category.id = catt._id;
      updatedItem.category.name = req.body.category;
      updatedItem.save();
      res.redirect("/seller/" + req.params.id + "/items");
    }
  });
  });
});


app.delete("/seller/:id/items/:item_id/", checkUser, function(req, res){
  Item.findByIdAndRemove(req.params.item_id, function(err){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/seller/" + req.params.id + "/items");
    }
  });
});


//auth routes
app.get("/signup", function(req, res){
  res.render("signup");
});


app.post("/signup", async (req, res) =>{

  const {error} = registerValidation({username:req.body.username, password: req.body.password});
  if(error) return res.status(400).send(error.details[0].message);

  const usernameExist = await User.findOne({username: req.body.username});
  if(usernameExist) return res.status(400).send("username exists");

  const salt = await bcrypt.genSalt(11);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    username: req.body.username,
    password: hashedPassword,
    name: req.body.name,
    mobile: req.body.mobile,
    addline1: req.body.addline1,
    addline2: req.body.addline2,
    city: req.body.city,
    zipcode: req.body.zipcode,
    state: req.body.state,
    country: req.body.country,
  });
  try {
    const savedUser = await user.save();
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET, {
    expiresIn: maxAge
  });
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    return res.redirect("/seller/" + user._id + "/settings");
  } catch (err){
    res.status(400).send(err);
    return res.render("signup");
  }
});


app.get("/signin", function(req, res){
  res.render("signin");
});


app.post("/signin", async (req, res) =>{
  const {error} = loginValidation(req.body);
  if(error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({username: req.body.username});
  if(!user) return res.status(400).send("username doesn't exist.");

  const validPass = await bcrypt.compare(req.body.password, user.password);
  if(!validPass) return res.status(400).send("Invalid password");

  //token(user);
  const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });

  if(user.isAdmin == true){
    res.redirect("/admin");
  } else {
  res.redirect("/seller");
  }
});


app.get("/signout", function(req, res){
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
});

app.get("/forgot", function(req, res){
  res.render("forgot");
});


app.post("/forgot", function(req, res, next){
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf){
        let token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({username: req.body.username}, function(err, user){
        if(!user){
          req.flash('error', "no account with that username exists.");
          return res.redirect('/forgot');
        } else {
          console.log("asfas" + user.username);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        user.save(function(err){
          done(err, token, user);
        });}
      });
    },
    function(token, user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: 'smtpout.secureserver.net',
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD
        }
      });
      let mailOptions = {
        to: user.username,
        from: process.env.USER_EMAIL,
        subject: 'Node.js password reset',
        text: "You are receiving this because you have requested the reset of the password" +
        "Please click on the following link or paste this into your browser to complete the process " +
        "http://" + req.headers.host + "/reset/" + token + "\n\n" +
        "if you did not request this, please ignore this and your password will be unchanged"
      };
      smtpTransport.sendMail(mailOptions, function(err){
        console.log('mail sent');
        req.flash('success', 'An email has been sent to' + user.username + 'with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err){
    if (err) return next(err);
    res.redirect('/emailcheck');
  });
});

app.get("/emailcheck", function(req, res){
  res.render("emailCheck");
});


app.get("/reset/:token", function(req, res){
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
    if(!user){
      req.flash('error', "password reset token is invalid or has expired.");
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});


app.post('/reset/:token', function(req, res){

  async.waterfall([
    function(done){
      User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, async function(err, user){
        if(!user){
          req.flash('error', 'password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm){

          const salt = await bcrypt.genSalt(11);
          const hashedPassword = await bcrypt.hash(req.body.password, salt);

          console.log("adfadf" + user);

          user.password = hashedPassword ;
          user.isAdmin = false;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          user.save();
          console.log("done");
          res.redirect('/passSuccess');

        } else {
          req.flash("error", "passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function(user, done){
      let smtpTransport = nodemailer.createTransport({
        service: 'smtpout.secureserver.net',
        auth: {
          user: process.env.USER_EMAIL,
          password: process.env.USER_PASSWORD
        }
      });
      let mailOptions = {
        to: user.username,
        from: process.env.USER_EMAIL,
        subject: 'Your password has been changed',
        text: 'Hello, \n\n' +
        'This is the confirmation that the password for your account' + user.username + 'has just changed.'
      };
      smtpTransport.sendMail(mailOptions, function(err){
        req.flash('success', 'Success!, your password has been changed.');
        done(err);
      });
    }
  ], function(err){
    res.redirect('/');
  });
});

app.get("/passSuccess", function(req, res){
  res.render("passSuccess");
});


app.get("/admin", isAdmin, function(req, res){
  res.render("admin");
});


app.get("/category/create", isAdmin, function(req, res){
  res.render("admin/makeCategory");
});


app.post("/category/create", isAdmin, function(req, res){
  const categoryObj = {
    name: req.body.name,
    slug: slugify(req.body.name)
  };
  if(req.body.parent){
    categoryObj.parentId = req.body.parent;
    }
    const cat = new Category(categoryObj);
    cat.save((err, category) => {
      if(err){
        console.log(err);
      } else {
        console.log(category);
      }
    });
    res.redirect("/getCategory");
});


app.get("/category/:id", isAdmin, function(req, res){
  Category.findById(req.params.id).populate("items").exec(function(err, category){
    if(err){
      console.log(err);
    } else {
      console.log(category);
      res.render("admin/catPro", {category: category});
    }
  });
});


app.get("/getCategory", isAdmin, function(req, res){
  Category.find({}, function(err, allCategories){
    if(err){
      console.log(err);
    } else {
      console.log(allCategories);
      res.render("admin/getCategory", {category: allCategories});
    }
  });
});


app.get("/adminSeller", isAdmin, function(req, res){
  User.find({}, function(err, allUsers){
    if(err){
      console.log(err);
    } else{
      console.log(allUsers);
      res.render("admin/adminSeller", {users: allUsers});
    }
  });
});


app.get("/adminseller/:id", isAdmin, function(req, res){
  User.findById(req.params.id, function(err, seller){
    if(err){
      console.log(err);
    } else {
      console.log(seller);
      res.render("admin/sellerEdit", {seller:seller});
    }
  });
});


app.put("/adminseller/:id", isAdmin, function(req, res){
  console.log(req.body);
  User.findByIdAndUpdate(req.params.id, {name: req.body.name, mobile: req.body.mobile}, function(err, item){
    if(err){
      console.log(err);
    } else {
      console.log(item);
      res.redirect("/adminSeller");
    }
  });
});


app.delete("/adminseller/:id", isAdmin, function(req, res){
  console.log(req.body);
  User.findByIdAndRemove(req.params.id, function(err, item){
    if(err){
      console.log(err);
    } else {
      console.log(item);
      res.redirect("/adminSeller");
    }
  });
});


app.get("/adminProducts", isAdmin, function(req, res){
  Item.find({}, function(err, allItems){
    if(err){
      console.log(err);
    } else {
      console.log(allItems);
      res.render("admin/adminProducts", {item: allItems});
    }
  });
});


app.get("/items/:id", isAdmin, function(req, res){
  Item.findById(req.params.id, function(err, item){
    if(err){
      console.log(err);
    } else {
      console.log(item);
      res.render("admin/itemEdit", {item:item});
    }
  });
});


app.put("/items/:id", isAdmin, function(req, res){
  console.log(req.body);
  Item.findByIdAndUpdate(req.params.id, {name:req.body.name, price: req.body.price, quantity: req.body.quantity, description: req.body.description}, function(err, item){
    if(err){
      console.log(err);
    } else {
      console.log(item);
      res.redirect("/adminProducts");
    }
  });
});


app.delete("/items/:id", isAdmin, function(req, res){
  console.log(req.body);
  Item.findByIdAndRemove(req.params.id, function(err, item){
    if(err){
      console.log(err);
    } else {
      console.log(item);
      res.redirect("/adminProducts");
    }
  });
});


app.get("/adminorder", isAdmin, function(req, res){
  Order.find({}, function(err, result){
    res.render("admin/userorder", {result:result});
  });
});


app.get("/admintorder", isAdmin, function(req, res){
  Torder.find({}, function(err, result){
    res.render("admin/guestorder", {result: result});
  });
});


//adminsignup routes

// app.get("/adminsignup", function(req, res){
//   res.render("adminsignup");
// });


// app.post("/adminsignup", async (req, res) =>{
//   console.log(req.body);

//   const {error} = registerValidation({username:req.body.username, password: req.body.password});
//   if(error) return res.status(400).send(error.details[0].message);

//   const usernameExist = await User.findOne({username: req.body.username});
//   if(usernameExist) return res.status(400).send("username exists");

//   const salt = await bcrypt.genSalt(11);
//   const hashedPassword = await bcrypt.hash(req.body.password, salt);

//   const user = new User({
//     username: req.body.username,
//     password: hashedPassword,
//     name: req.body.name,
//     mobile: req.body.mobile,
//     addline1: req.body.addline1,
//     addline2: req.body.addline2,
//     city: req.body.city,
//     zipcode: req.body.zipcode,
//     state: req.body.state,
//     country: req.body.country,
//     isAdmin: true
//   });
//   try {
//     const savedUser = await user.save();
//     const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET, {
//     expiresIn: maxAge
//   });
//     res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//     return res.redirect("/seller/" + user._id + "/settings");
//   } catch (err){
//     res.status(400).send(err);
//     return res.render("signup");
//   }
// });



app.get("/about", function(req, res){
  res.render("about");
});



app.listen(PORT, function(){
  console.log("server is live...");
});
