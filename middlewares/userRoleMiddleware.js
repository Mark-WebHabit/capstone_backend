import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { Users } from "../models/Users.js";

export const verifyGuest = asyncHandler(async (req, res, next) => {
  if (!req.headers?.authorization) {
    return res.status(403).json({ error: "Forbidden: Missing Authorization" });
  }

  const token = req.headers.authorization.split(" ")[1]; // get the bearer token

  if (!token) {
    return res.status(403).json({ error: "Forbidden: Missing Access token" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      //access token is invalid or expired
      return res
        .status(401)
        .json({ error: "Access Token Expired: Refresh Access Token" });
    } else {
      const user = await Users.findOne({ _id: decoded.userId });

      if (!user) {
        return res.status(403).json({ error: "Unknow User" });
      }

      const role = user.role;

      if (role == "guest") {
        next();
      } else {
        return res
          .status(401)
          .json({ error: "Unauthorized to make to the operation" });
      }
    }
  });
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  if (!req.headers?.authorization) {
    return res.status(403).json({ error: "Forbidden: Missing Authorization" });
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access Token Expired: Refresh Access Token" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      //access token is invalid or expired
      return res
        .status(401)
        .json({ error: "Access Token Expired: Refresh Access Token" });
    } else {
      const user = await Users.findOne({ _id: decoded.userId });

      if (!user) {
        return res.status(403).json({ error: "Unknow User" });
      }

      const role = user.role;

      if (role == "admin") {
        next();
      } else {
        return res
          .status(401)
          .json({ error: "Unauthorized to make to the operation" });
      }
    }
  });
});
