const { Router } = require("express");
const { login, register } = require("../controller/loginSignUpController");

const loginSignUpRouter = Router()

loginSignUpRouter.route('/login').post(login)
loginSignUpRouter.route('/register').post(register)

module.exports = loginSignUpRouter