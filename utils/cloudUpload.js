const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

exports.cloudinaryUploader = async (path) => {
  const { url } = await cloudinary.uploader.upload(path);

  return { blogImg: url };
};
