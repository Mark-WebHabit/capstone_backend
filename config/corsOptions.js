// const whiteList = ["http://localhost/8080", "http://localhost/8081"];
const whiteList = [
  "https://holyangelsapi.onrender.com",
  "holyangelsapi.onrender.com",
];
export const corsOptions = {
  origin: (origin, callback) => {
    if (whiteList.indexOf(origin) == -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
