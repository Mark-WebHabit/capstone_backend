import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// routes
import authRoutes from "./routes/authRoutes.js";
import mappingRoutes from "./routes/mappingRoutes.js";
import userRoutes from "./routes/userRoute.js";
import adminRoutes from "./routes/adminApiRoute.js";

// custom middleware file
import { errorLogger } from "./middlewares/errorLogger.js";

// config
import { corsOptions } from "./config/corsOptions.js";

// allow access to environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8081;

app.set("trust-proxy", true);

// restrict cors to un-specified whitelist(list of accesptable origins)
app.use(cors(corsOptions));

// set ejs as view engin
app.set("view engine", "ejs");
// set te views directory
app.set("views", "views");

//access public folder
app.use(express.static(path.join(__dirname, "public")));

// accep formdata
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));

app.get("/", (req, res) => {
  res.send(
    `<h1>Nothing to see here</h1></br><a href="https://holyangels.onrender.com">Go to home</a>`
  );
});

app.get("/email-verify", (req, res) => {
  res.render("email_verified");
});

// auth
// public access
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
app.use("/auth", authRoutes);

// put middleware to these route that check for access token
// protected endpoint
app.use("/user", userRoutes);
app.use("/mapping", mappingRoutes);
app.use("/admin", adminRoutes);

// custom middleware to catch errors
app.use(errorLogger);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT);
  });
