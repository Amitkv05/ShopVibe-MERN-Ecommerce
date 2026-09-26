import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "./handleAsyncError.js";

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;

  const authorization = req.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return null;
}

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new HandleError("Please login to access this resource", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const user = await User.findById(decodedData.id);

  if (!user) {
    return next(new HandleError("The user belonging to this token no longer exists", 401));
  }

  if (user.changedPasswordAfter(decodedData.iat)) {
    return next(new HandleError("Password was recently changed. Please login again", 401));
  }

  req.user = user;
  next();
});

export const roleBasedAccess = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HandleError("You are not allowed to access this resource", 403));
  }
  next();
};
