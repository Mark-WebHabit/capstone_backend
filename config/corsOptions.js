// const whiteList = ["http://localhost:3000", "http://localhost:8080"];

const whiteList = [
  "https://holyangels.onrender.com",
  "holyangels.onrender.com",
  // Include any other origins you want to allow
];

export const corsOptions = {
  origin: (origin, callback) => {
    if (whiteList.indexOf(origin) !== -1) {
      // add !origin for  development in condition
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS"), false); // Disallow
    }
  },
};
