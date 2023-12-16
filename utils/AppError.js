class MoError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
  getCode() {
    return 500;
  }
}

class BadRequest extends MoError {
  constructor(message) {
    super(message);
    this.message = message;
  }
  getCode() {
    return 400;
  }
}

class NotFound extends MoError {
  constructor(message) {
    super(message);
    this.message = message;
  }
  getCode() {
    return 404;
  }
}

module.exports = { MoError, BadRequest, NotFound };
