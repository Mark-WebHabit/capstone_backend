import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (!req.headers?.authorization) {
    return res.status(403).json({ error: "Forbidden: Missing Authorization" });
  }

  const token = req.headers.authorization.split(" ")[1]; // get the bearer token

  if (!token) {
    return res.status(403).json({ error: "Forbidden: Missing Access token" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      //access token is invalid or expired
      return res
        .status(401)
        .json({ error: "Access token Expired: Refresh Access token" });
    } else {
      next();
    }
  });
});
