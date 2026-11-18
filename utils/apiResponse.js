export const sendSuccess = (res, data, message = "Success", statusCode = 200, cacheSeconds = 0) => {
  if (cacheSeconds > 0) {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=60`
    );
  }
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, message = "An error occurred", statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? (error?.message || error) : undefined,
    timestamp: new Date().toISOString()
  });
};
