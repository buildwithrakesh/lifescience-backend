import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, "Not authorized, token missing", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "vetora_super_secret_jwt_key_2026_secure");
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return sendError(res, "User not found with this token", 401);
    }
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Not authorized, token invalid or expired", 401, error);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return sendError(res, "Access denied: Administrator privileges required", 403);
  }
};
