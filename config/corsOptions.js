// const whiteList = ["http://localhost/8080", "http://localhost/8081"];

const whiteList = [
  "https://holyangels.onrender.com",
  "holyangels.onrender.com",
  // Include any other origins you want to allow
];

export const corsOptions = {
  origin: (origin, callback) => {
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"), false); // Disallow
    }
  },
};
