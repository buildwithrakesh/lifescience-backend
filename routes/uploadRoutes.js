import express from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const router = express.Router();

// Memory storage to stream directly to Cloudinary CDN
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|svg/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files (JPEG, PNG, WEBP, SVG) are allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
  fileFilter,
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const type = req.query.type || "general";
    const folder = `lifescience/${type}s`;

    // Upload buffer directly to Cloudinary CDN
    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

    const result = await uploadStream();

    return sendSuccess(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
      "Image uploaded to Cloudinary successfully"
    );
  } catch (error) {
    return sendError(res, "Cloudinary upload failed: " + error.message, 500, error);
  }
});

export default router;
