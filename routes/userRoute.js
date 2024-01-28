import express from "express";

import {
  changeUsername,
  changePassword,
  getLoginHistory,
} from "../controllers/userController.js";

import { verifyAccessToken } from "../middlewares/verifyAccessToken.js";

const router = express.Router();

// use middleware that checks the access token
// only put verify guest and verify admin middleware to an endpoint speicifc to them
router
  .post("/changeusername", verifyAccessToken, changeUsername)
  .post("/changepass", verifyAccessToken, changePassword)
  .get("/history/:email", verifyAccessToken, getLoginHistory);
export default router;
