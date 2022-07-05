//jshint esversion:8
const jwt = require("jsonwebtoken");
const ctoken = require("./app");
console.log(ctoken);
module.exports = function (req, res, next){
  const token = req.header("auth-token");
  console.log(token);
  if(!token) return res.status(401).send("Access denied");
  console.log(token);

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken)=>{
      if(err){
                console.log(err.message);
                res.locals.user = null;
                next();
            }
            else{
                res.locals.user = decodedToken;
                next();
            }
    });
    req.user = verified;
    next();
  } catch (e) {
    res.status(400).send("Invalid token");
  }
};
