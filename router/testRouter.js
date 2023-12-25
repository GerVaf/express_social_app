const { Router } = require("express");
const testing = Router();
const { uploadImg } = require("../controller/testController");
const { multerUpload, cloudUpload } = require("../middleware/imageUpload");

testing.route("/test-img").post(multerUpload, cloudUpload, uploadImg);

module.exports = testing;
