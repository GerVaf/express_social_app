const { MoError, BadRequest, NotFound } = require("../utils/AppError");

const errorHandler = (error, req, res, next) => {
  if (error instanceof MoError) {
    return res.status(error.getCode()).json({ message: error.message });
  }
  if (error instanceof BadRequest) {
    return res.status(error.getCode()).json({ message: error.message });
  }
  if (error instanceof NotFound) {
    return res.status(error.getCode()).json({ message: error.message });
  }
  return (
    res.status(500).json({ message: "Internal ServerError!" }),
    console.log(error)
  );
};

module.exports = errorHandler;
