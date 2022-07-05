//jshint esversion:8
let Joi = require("@hapi/joi");

const registerValidation = data => {
const schema = {
  username: Joi.string().min(6).required(),
  password: Joi.string().min(6).required()
};
return Joi.validate(data, schema);
//schema.validate(data);
};


const loginValidation = data => {
const schema = {
  username: Joi.string().min(6).required(),
  password: Joi.string().min(6).required()
};
return Joi.validate(data, schema);
//schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
