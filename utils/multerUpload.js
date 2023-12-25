const multer = require("multer");
const fs = require("fs");
const path = require("path");

const fileSize = 1 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const filePath = "./uploads";
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }
    cb(null, filePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

const fileWithmulterUploader = multer({ storage: storage, limits: { fileSize } }).single(
  "blogImg"
);

module.exports = fileWithmulterUploader;
