import PushSubscription from "../models/PushSubscription.js";

// @desc    Subscribe / Save FCM Push Token
// @route   POST /api/notifications/subscribe
// @access  Public
export const subscribePushToken = async (req, res) => {
  try {
    const { token, userId, role, userAgent } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM Token is required" });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { token },
      {
        token,
        userId: userId || "anonymous",
        role: role || "visitor",
        userAgent: userAgent || "",
        platform: "web",
        isActive: true,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Push notification subscription registered successfully",
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    res.status(500).json({ success: false, message: "Failed to save push subscription", error: error.message });
  }
};

// @desc    Unsubscribe / Deactivate Push Token
// @route   POST /api/notifications/unsubscribe
// @access  Public
export const unsubscribePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await PushSubscription.findOneAndUpdate({ token }, { isActive: false });
    }
    res.status(200).json({ success: true, message: "Push notifications turned off successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to turn off notifications", error: error.message });
  }
};

// @desc    Get Push Subscribers Count
// @route   GET /api/notifications/subscribers-count
// @access  Public (or Admin)
export const getSubscribersCount = async (req, res) => {
  try {
    const count = await PushSubscription.countDocuments({ isActive: true });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error counting subscribers", error: error.message });
  }
};

// @desc    Trigger/Simulate Admin Broadcast Push
// @route   POST /api/notifications/broadcast
// @access  Admin/Public
export const broadcastNotification = async (req, res) => {
  try {
    const { title, body, url } = req.body;
    const subscribers = await PushSubscription.find({ isActive: true }).select("token");

    // Here we log the broadcast simulation; if Firebase Admin SDK service-account is provided,
    // it will deliver via admin.messaging().sendEachForMulticast()
    console.log(`[Push Broadcast] Sending to ${subscribers.length} subscribers: "${title}" - "${body}"`);

    res.status(200).json({
      success: true,
      subscribersCount: subscribers.length,
      message: `Notification broadcast prepared for ${subscribers.length} subscriber(s).`,
      preview: { title, body, url },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Broadcast failed", error: error.message });
  }
};
