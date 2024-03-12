import asyncHandler from "express-async-handler";

export const assignIp = asyncHandler(async (req, res, next) => {
  const forwardedIp = req.headers["x-forwarded-for"]?.split(",").shift();

  // Alternatively, use the connection remote address
  const directIp = req.connection.remoteAddress;

  // Choose the forwarded IP if available, otherwise use the direct connection IP
  const clientIp = forwardedIp || directIp;

  // Attach the client IP to the request object for later use
  req.clientIp = clientIp;

  next();
});
