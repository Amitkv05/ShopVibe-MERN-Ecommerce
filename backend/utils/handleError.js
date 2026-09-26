class HandleError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "HandleError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HandleError;
