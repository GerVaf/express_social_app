const { BadRequest } = require("../utils/AppError");
const { cloudinaryUploader } = require("../utils/cloudUpload");
const fileWithmulterUploader = require("../utils/multerUpload");
const { tryCatch } = require("../utils/tryCatch");

const fs = require("fs");
const unlink = require("fs").promises;

exports.multerUploadMiddleware = tryCatch(async (req, res, next) => {
  fileWithmulterUploader(req, res, function (err) {
    // console.log(err)
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new BadRequest("File must be under 1MB!"));
      }
    }
    if (!req.file) {
      next(new BadRequest("File is required from request!"));
    }
    next();
  });
});

exports.cloudUploadMiddleware = tryCatch(async (req, res, next) => {
  if (!req.file) next(new BadRequest("File is required from multer !"));
  //   path is from multer
  const { path } = req.file;
  console.log(path);

  const { blogImg } = await cloudinaryUploader(path);
  if (!blogImg) {
    await fs.unlink(path);
    await unlink(path);

    next(new BadRequest("There is error in Cloud!"));
  }
  req.blogImg = blogImg;
  // console.log(blogImg);
  next();
});
