import express from "express";

// controller files
import {
  register,
  requestVerificationEmail,
  login,
  verifyAuthUser,
  logout,
  getUserRole,
  forgotPass,
  renewPassword,
  verifyValidityToChangepass,
  changePassPost,
  sendContactMessage,
} from "../controllers/authController.js";
import { refreshAccessToken } from "../controllers/refreshTokenController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyAuthUser);
router.get("/role/:email", getUserRole);
router.get("/:id", requestVerificationEmail);
router.get("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/forgot_pass", forgotPass);
router.get("/renew_pass/:token", renewPassword);
router.get("/can_changepass/:token", verifyValidityToChangepass);
router.post("/changepass", changePassPost);
router.post("/sendmail", sendContactMessage);

export default router;
