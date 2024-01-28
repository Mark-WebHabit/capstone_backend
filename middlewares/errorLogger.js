import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const errorLogger = (err, req, res, next) => {
  try {
    if (!err) {
      return next();
    }

    // Determine the HTTP status code for the error response
    const status = res.statusCode === 200 ? 500 : res.statusCode;

    // Get the origin (if available) from the request headers
    const origin = req.headers.origin || "Unknown Origin";

    // Extract the error message from the error object
    const error = err.message || "Unknown Error";

    // Identify the end point from where the error occur
    const endpoint = req.url;

    // formatted error log
    const log = `${new Date().toLocaleString()}\t\tstatus:${status}\t\tend-point:${endpoint}\t\torigin:${origin}\t\terror:${error}\n`;

    // logger directory path
    const loggerDirectoryPath = path.join(__dirname, "..", "log");
    const errorLoggerFilePath = path.join(
      __dirname,
      "..",
      "log",
      "errorLog.txt"
    );

    // check if log directory exists, if not create one
    if (!fs.existsSync(loggerDirectoryPath)) {
      fs.mkdirSync(loggerDirectoryPath);
    }

    // check if logger file exists, if not create one
    if (!fs.existsSync(errorLoggerFilePath)) {
      fs.writeFileSync(errorLoggerFilePath, log);
    } else {
      fs.appendFileSync(errorLoggerFilePath, log);
    }

    return res.status(status).json({
      error: "Something went wrong: check the error log for error details",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
