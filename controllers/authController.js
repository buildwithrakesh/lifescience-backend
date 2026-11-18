import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "vetora_super_secret_jwt_key_2026_secure", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, farmName } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "Please provide name, email and password", 400);
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return sendError(res, "User already exists with this email", 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      farmName: farmName || "",
      role: "user",
    });

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        role: user.role,
        token,
      },
      "Registration successful",
      201
    );
  } catch (error) {
    return sendError(res, "Registration failed", 500, error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Please provide email and password", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        role: user.role,
        addresses: user.addresses,
        token,
      },
      "Login successful"
    );
  } catch (error) {
    return sendError(res, "Login failed", 500, error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    return sendSuccess(res, user, "Profile loaded");
  } catch (error) {
    return sendError(res, "Failed to get profile", 500, error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, farmName } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (farmName !== undefined) user.farmName = farmName;

    await user.save();

    return sendSuccess(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        role: user.role,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    return sendError(res, "Failed to update profile", 500, error);
  }
};

// @desc    Update saved addresses
// @route   PUT /api/auth/addresses
// @access  Private
export const updateAddresses = async (req, res) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) {
      return sendError(res, "Addresses must be an array", 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.addresses = addresses;
    await user.save();

    return sendSuccess(res, user.addresses, "Addresses updated successfully");
  } catch (error) {
    return sendError(res, "Failed to update addresses", 500, error);
  }
};
