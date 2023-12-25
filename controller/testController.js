const { tryCatch } = require("../utils/tryCatch");

exports.uploadImg = tryCatch(async (req, res) => {
  const { blogImg } = req;
  console.log(blogImg);

  res.status(200).json({ message: "Blah",blogImg });
});
