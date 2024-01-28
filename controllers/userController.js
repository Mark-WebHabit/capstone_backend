import asyncHandler from "express-async-handler";
import { Users } from "../models/Users.js";
import { LoginHistory } from "../models/LoginHistory.js";
import bcrypt from "bcrypt";

// @desc - change username
// Method - POST
// private access
// endpoint - /changeUsername
export const changeUsername = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Invalid Parameter: USer not defined" });
  }

  if (!username || username.length <= 6) {
    return res
      .status(400)
      .json({ error: "Invalid Username: empty or too short" });
  }

  const authUser = await Users.findOne({ email });

  if (!authUser) {
    return res.status(404).json({ error: "User not defined" });
  }

  const updatedUsername = await Users.findOneAndUpdate(
    { _id: authUser._id },
    { username },
    { new: true }
  );

  if (updatedUsername) {
    let authenticatedUser = updatedUsername.toObject();
    delete authenticatedUser.password;
    return res.status(200).json({ data: authenticatedUser });
  } else {
    return res.status(400).json({ error: "Something went wrong" });
  }
});

// @desc - change password
// Method - POST
// private access
// endpoint - /changepass
export const changePassword = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || !email) {
    return res
      .status(400)
      .json({ error: "Invalid Password: Fields cannot be blanked" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: "Password too short: Strong Password combination recommended",
    });
  }

  const user = await Users.findOne({ email });

  if (!user) {
    return res
      .status(403)
      .json({ error: "Unknown user: cannot continue operation" });
  }

  const isMatched = await bcrypt.compare(currentPassword, user.password);

  if (!isMatched) {
    return res.status(400).json({ error: "Wrong Password" });
  }

  const newHashedPass = await bcrypt.hash(newPassword, 10);

  const updatedUserPassword = await Users.findOneAndUpdate(
    { _id: user._id },
    { password: newHashedPass },
    { new: true }
  ).exec();

  if (!updatedUserPassword) {
    return res
      .status(500)
      .json({ error: "Something went wrong, Try restarting the system" });
  }
  let updatedUser = updatedUserPassword.toObject();
  delete updatedUser.password;
  return res.json({ data: updatedUser });
});

export const getLoginHistory = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res
      .status(400)
      .json({ error: 'Invalid Parameter: "No email found' });
  }
  const user = await Users.findOne({ email });
  if (!user) {
    return res.status(403).json({ error: "Unknown User Found" });
  }

  const loginistory = await LoginHistory.find({ userId: user._id });

  if (loginistory.length) {
    return res.json({ data: loginistory });
  }
  return res.json({ data: [] });
});
