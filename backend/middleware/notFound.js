import HandleError from "../utils/handleError.js";

export default (req, res, next) => {
  next(new HandleError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
