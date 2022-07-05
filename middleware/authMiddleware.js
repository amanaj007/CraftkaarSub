//jshint esversion:8
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/signin');
      } else {
        console.log(decodedToken);
        let user = await User.findById(decodedToken._id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.redirect('/signin');
  }
};


const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/signin');
      } else {
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaa");
        console.log(decodedToken._id);
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaa");
        let user = await User.findById(decodedToken._id);
        res.locals.user = user;
        if(decodedToken._id === req.params.id){
        next();
      } else {
          res.redirect('/signin');
        }
      }
    });
  } else {
    res.redirect('/signin');
  }
};


const isAdmin = (req, res, next) => {
  const token = req.cookies.jwt;
  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/signin');
      } else {
        console.log(decodedToken);
        let user = await User.findById(decodedToken._id);
        res.locals.user = user;
        if(user.isAdmin == true){
        next();}
      }
    });
  } else {
    res.redirect('/signin');
  }
};


// check current user
// const checkUser = (req, res, next) => {
//   const token = req.cookies.jwt;
//   if (token) {
//     jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
//       if (err) {
//         res.locals.user = null;
//         next();
//       } else {
//         let user = await User.findById(decodedToken._id);
//         res.locals.user = user;
//         console.log(res.locals.user);
//         console.log(user);
//         next();
//       }
//     });
//   } else {
//     res.locals.user = null;
//     next();
//   }
// };


module.exports = { requireAuth, checkUser, isAdmin };
