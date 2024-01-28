import express from "express";

import {
  getAllDeceased,
  getAllPlots,
  getAllLawns,
  getLawn,
  searchDeceaseds,
  getPlotInfo,
  getAreaPlots,
} from "../controllers/mappingController.js";

import { verifyAccessToken } from "../middlewares/verifyAccessToken.js";
import { verifyGuest } from "../middlewares/userRoleMiddleware.js";

const router = express.Router();

// use middleware that checks the access token
// only put verify guest and verify admin middleware to an endpoint speicifc to them
router
  .get("/deceaseds", verifyAccessToken, getAllDeceased)
  .get("/plots", verifyAccessToken, getAllPlots)
  .get("/lawns", verifyAccessToken, getAllLawns)
  .get("/lawns/:lawnName", verifyAccessToken, getLawn)
  .get("/search/:query", verifyAccessToken, searchDeceaseds)
  .get("/plots/:plotId", verifyAccessToken, getPlotInfo)
  .get("/:areaTypeName", verifyAccessToken, getAreaPlots);

export default router;
