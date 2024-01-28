import asyncHandler from "express-async-handler";
import { Users } from "../models/Users.js";
import jwt from "jsonwebtoken";

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Invalid Email" });
  }

  const user = await Users.findOne({ email });

  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized Access: Account not found" });
  }

  const refreshToken = user.refreshToken;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ error: "No Refresh Token Found: Proceed to Login" });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        //invalid refresh token or expired
        return res
          .status(400)
          .json({ error: "Session Expired: Please Login again" });
      } else {
        const userId = decoded.userId;
        const newAccessToken = await jwt.sign(
          { userId },
          process.env.ACCESS_TOKEN_SECRET
        );
        return res.status(201).json({ token: newAccessToken, email });
      }
    }
  );
});
