import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

// custom file
import {
  sendEmail,
  validatePasswordRenewal,
  sendEmailViaContact,
} from "../config/transporter.js";
import { getTime } from "../utilities/getTime.js";
import { getDate } from "../utilities/getDate.js";

// models
import { Token } from "../models/EmailVerification.js";
import { Users } from "../models/Users.js";
import { LoginHistory } from "../models/LoginHistory.js";

// @desc - Register
// endpoint - /auth/register
// access - PUBLIC
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || username.length < 3) {
    return res
      .status(400)
      .json({ error: "Invalid Username: Username too short" });
  }

  if (!email || email.length <= 10) {
    // errors.push({ email: "Invalid Email Format: Invalid email format" });
    return res.status(400).json({ error: "Invalid Email Format" });
  }

  if (password?.length < 8) {
    return res.status(400).json({
      error: "Invalid Password Format: Password must be 8 characters long ",
    });
  }

  // check for duplicate email and push to errors
  const duplicateEmail = await Users.findOne({ email }).exec();
  if (duplicateEmail) {
    // check if email is not verified but the token is a valid
    if (!duplicateEmail?.verified) {
      const token = await Token.findOne({ userId: duplicateEmail._id });

      if (!token) {
        // if there is an existing data that is not verified but without token, delete it
        await Users.deleteOne({ userId: duplicateEmail._id });
      } else {
        // if there is a token
        jwt.verify(
          token.token,
          process.env.VERIFICATION_EMAIL_TOKEN,
          async (err, decoded) => {
            // if token is expired delete the data
            if (err) {
              await Users.deleteOne({ _id: duplicateEmail._id });
            }
          }
        );
        return res.status(409).json({
          error:
            "A verification link has already been sent to your email account",
        });
      }
    } else {
      return res
        .status(409)
        .json({ error: "Email Exists: Email already taken" });
    }
  }

  // check for duplicate username and push to errors
  const duplicateName = await Users.findOne({ username: username }).exec();
  if (duplicateName) {
    // check if email is not verified but the token is a valid
    if (!duplicateName.verified) {
      const token = await Token.findOne({ userId: duplicateName._id });

      if (!token) {
        // if there is an existing data that is not verified but without token, delete it
        await Users.deleteOne({ _id: duplicateName._id });
      } else {
        // if there is a token
        jwt.verify(
          token.token,
          process.env.VERIFICATION_EMAIL_TOKEN,
          (err, decoded) => {
            // if token is expired delete the data
            if (err) {
              Users.deleteOne({ _id: duplicateName._id });
            }
          }
        );
        return res.status(409).json({
          error: "Username Exists: Username already taken",
        });
      }
    } else {
      return res
        .status(409)
        .json({ error: "Username Exists: Username already taken" });
    }
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // push data to database
  const document = {
    username: username,
    email,
    password: hashedPassword,
  };

  const createUser = new Users(document);

  const response = await createUser.save();
  let newUser = response.toObject();
  delete newUser.password;

  // sign a web token as new token for email verification
  const saltToken = jwt.sign(
    {
      userId: newUser._id,
    },
    process.env.VERIFICATION_EMAIL_TOKEN,
    { expiresIn: "20min" }
  );

  const createToken = new Token({
    userId: newUser._id,
    token: saltToken,
  }).save();

  const token = (await createToken).save();

  // change this to deployed url after deployment
  const url = `${process.env.BASE_URL}/auth/${newUser._id}`;
  await sendEmail(newUser.email, "Verify Email", url);

  return res.status(201).json({
    message:
      "An email was sent to your account, Please verify before it expires in 20min",
  });
});

// @desc - Send Email Verification
// endpoint - /auth/id
// access - PUBLIC
export const requestVerificationEmail = asyncHandler(async (req, res) => {
  const user = await Users.findOne({ _id: req.params.id });
  if (!user) {
    return res.status(400).send(`
      <script>
        alert('Invalid Link, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>
    `);
  }

  const token = await Token.findOne({
    userId: user._id,
  });

  if (!token) {
    // return res.status(400).json({ error: "Invalid Link" });
    return res.redirect(401, process.env.CLIENT_URL);
  }

  jwt.verify(
    token.token,
    process.env.VERIFICATION_EMAIL_TOKEN,
    async (err, decoded) => {
      if (err) {
        // if the token expires and the data remains not verified delete it
        await Users.deleteOne({ _id: token.userId });
        await Token.deleteOne({ _id: token._id });
        return res.status(403).send(`
      <script>
        alert('Expired Link, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>
    `);
      }
    }
  );

  // if verified that a valid url was sent
  // await Users.findOneAndUpdate(
  //   {
  //     _id: user._id,
  //   },
  //   { $set: { verified: true } }
  // );
  await Users.findOneAndUpdate(
    {
      _id: user.id,
    },
    { verified: true }
  );
  await Token.deleteOne({ _id: token._id });

  // redirect to login page
  return res.redirect(302, `${process.env.CLIENT_URL}`);
});

// @desc - Login
// endpoint - /auth/login
// access - PUBLIC
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // check if user exists
  const matchedUser = await Users.findOne({ email: email });

  if (!matchedUser) {
    // if no user found
    return res.status(404).json({ error: "Account does not exists" });
  }

  if (!matchedUser.verified) {
    return res
      .status(403)
      .json({ error: "Account not verified, Please check you mail" });
  }

  const isPassMatched = await bcrypt.compare(password, matchedUser.password);

  if (!isPassMatched) {
    return res.status(400).json({ error: "Wrong email or password" });
  }

  // implement jwt here
  const accessToken = jwt.sign(
    { userId: matchedUser._id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
  const refreshToken = jwt.sign(
    { userId: matchedUser._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );

  const updatedUser = await Users.findOneAndUpdate(
    { _id: matchedUser._id },
    { refreshToken },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(500).json({ error: "System error: Failed to login" });
  }

  const snapshot = {
    userId: matchedUser._id,
    loginDate: getDate(),
    loginTime: getTime(),
    ipAddress: req.ip || req.connection.remoteAddress,
  };

  const loginInfo = new LoginHistory(snapshot);
  let savedLogin = loginInfo.save();

  if (savedLogin) {
    return res.status(200).json({
      token: accessToken,
      email: matchedUser.email,
      role: matchedUser.role,
      username: matchedUser.username,
    });
  } else {
    return res.status(500).json({
      error: "Couldn't Login User: Please refresh the browser and try again",
    });
  }
});

// @desc - Verify
// endpoint - /auth/verify
// access - PUBLIC
export const verifyAuthUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await Users.findOne({ email });

  if (!req.headers.authorization) {
    return res
      .status(400)
      .json({ error: "Bad Request: Missing Authorization" });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing Bearer token" });
  }

  // Verify the access token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      const refreshToken = user.refreshToken;

      if (!refreshToken) {
        return res.status(403).json({ error: "You are not allowed here!" });
      }

      // Verify the refresh token
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
          if (err) {
            return res
              .status(403)
              .json({ error: "Session expired, Please log in again" });
          } else {
            // If the refresh token is still valid, send a new access token
            const userId = decoded.userId;
            const newAccessToken = jwt.sign(
              { userId },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "1h" }
            );

            return res.status(200).json({
              token: newAccessToken,
              email: user.email,
              role: user.role,
              username: user.username,
            });
          }
        }
      );
    } else {
      return res.status(200).json({
        token: token,
        email: user.email,
        role: user.role,
        username: user.username,
      });
    }
  });
});

// @desc - Verify
// endpoint - /auth/forgot_pass
// access - PUBLIC
export const forgotPass = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Empty Credential: Expected Email" });
  }

  //check if an email exists in the database
  const user = await Users.findOne({ email });

  if (!user || !user?.email) {
    return res.json({ data: "Account Does not Exist" });
  }

  const emailToken = jwt.sign(
    { email, id: user._id },
    process.env.FORGOT_PASS_TOKEN,
    {
      expiresIn: "5min",
    }
  );
  let encodedEmailToken = encodeURIComponent(emailToken);
  encodedEmailToken = encodedEmailToken.replace(/\./g, "_dt_");
  const url = `${process.env.BASE_URL}/auth/renew_pass/${encodedEmailToken}`;
  await validatePasswordRenewal(email, "Forgot password?", url);

  return res.status(201).json({
    data: "An email was sent to your account, Please Use Before It expires in 5min",
  });
});

// @desc - Verify
// endpoint - /auth/renew_pass/token
// access - PUBLIC
export const renewPassword = asyncHandler(async (req, res) => {
  let token = req.params.token;

  if (!token) {
    return res.status(404).send(`<script>
        alert('Page Not Found, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
  }

  token = token.replace(/_dt_/g, ".");
  token = decodeURIComponent(token);

  jwt.verify(token, process.env.FORGOT_PASS_TOKEN, async (err, decoded) => {
    if (err) {
      return res.status(403).send(`<script>
        alert('Link Expired, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
    } else {
      const { id } = decoded;
      const user = await Users.findOne({ _id: id });

      if (!user) {
        return res.status(401).send(`<script>
        alert('Unknown User, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
      }
      // const encodedToken = encodeURIComponent(token);
      let newToken = token.replace(/\./g, "_dt_");
      newToken = encodeURIComponent(newToken);
      return res.redirect(
        `${process.env.CLIENT_URL}/auth/renew_pass/${newToken}`
      );
    }
  });
});

// @desc - Verify
// endpoint - /auth/changepass/token
// access - PUBLIC
export const verifyValidityToChangepass = asyncHandler(async (req, res) => {
  let { token } = req.params;

  if (!token) {
    return res.status(404).send(`<script>
        alert('Page Not Found, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
  }
  token = token.replace(/_dt_/g, ".");
  let decodedToken = decodeURIComponent(token);

  jwt.verify(
    decodedToken,
    process.env.FORGOT_PASS_TOKEN,
    async (err, decoded) => {
      if (err) {
        return res.status(403).send(`<script>
        alert('Token Expired Request A New One, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
      }

      const { id } = decoded;

      if (!id) {
        return res.status(401).send(`<script>
        alert('Unknown User, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
      }

      const user = await Users.findOne({ _id: id }).select("-password").exec();

      if (!user) {
        return res.status(401).send(`<script>
        alert('Unknown User, redirecting to ${process.env.CLIENT_URL}');
        window.location.href = '${process.env.CLIENT_URL}';
      </script>`);
      }

      return res.json({ data: user });
    }
  );
});

// @desc - Verify
// endpoint - /auth/changepass/token
// access - PUBLIC
//method POST
export const changePassPost = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password)
    return res
      .status(400)
      .json({ error: "Invalid Parameter: Expected Token And Password" });

  if (password.length < 8) {
    return res.status(400).json({ error: "Password Too Short" });
  }

  let validToken = token.replace(/_dt_/g, ".");

  jwt.verify(
    validToken,
    process.env.FORGOT_PASS_TOKEN,
    async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "Token Expired: Request A New One And Try Again" });
      }

      const { email, id } = decoded;
      if (!email || !id) return res.status(401).json({ error: "Unknown User" });

      const user = await Users.findOne({ _id: id });

      if (!user) return res.status(401).json({ error: "User Does Not Exists" });

      if (user.email !== email)
        return res
          .status(401)
          .json({ error: "Information About This User Mismatched" });

      let hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await Users.findOneAndUpdate(
        { _id: user._id },
        { password: hashedPassword },
        { new: true }
      );

      if (!updatedUser)
        return res
          .status(500)
          .json({ error: "Something Went Wrong: Try Restarting The Page" });

      return res.json({ data: updatedUser });
    }
  );
});

// @desc - Logout
// endpoint - /auth/logout
// access - PUBLIC
export const logout = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(404).json({ error: "Invalid Parameter" });
  }

  const user = await Users.findOneAndUpdate({ email }, { refreshToken: null });

  if (!user) {
    return res.status(204);
  }

  return res.status(204).json({ data: "Refresh tokoen cleared" });
});

// @desc - get user role
// public access
// end - point = /auth/role/email
export const getUserRole = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Invalid Parameter" });
  }

  const user = await Users.findOne({ email });
  if (!user) {
    return res.status(403).json({ error: "Forbidden User" });
  }

  const role = user.role;

  return res.json({ role });
});

// @desc - Verify
// endpoint - /auth/sendmail
// access - PUBLIC
export const sendContactMessage = asyncHandler(async (req, res) => {
  const { email, name, subject, message } = req.body;

  if (!email || !name || !subject || !message)
    return res.status(400).json({ error: "All fields Required" });

  if (!validator.isEmail(email))
    return res
      .status(400)
      .json({ error: "Please Provide A Valid Email Address" });

  await sendEmailViaContact(email, name, subject, message);

  return res.json({ data: { success: true } });
});
