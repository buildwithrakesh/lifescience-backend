import express from "express";
import {
  subscribePushToken,
  unsubscribePushToken,
  getSubscribersCount,
  broadcastNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/subscribe", subscribePushToken);
router.post("/unsubscribe", unsubscribePushToken);
router.get("/subscribers-count", getSubscribersCount);
router.post("/broadcast", broadcastNotification);

export default router;
