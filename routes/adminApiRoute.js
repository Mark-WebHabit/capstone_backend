import express from "express";

import {
  getAreasAdmin,
  getTableInfo,
  searchDeceaseds,
  updateNotWithIntermentStatus,
  updateInterment,
  getPersonnel,
  searchForGuests,
  updateGuestAsEmployee,
  assignRole,
} from "../controllers/adminApiController.js";

import { verifyAccessToken } from "../middlewares/verifyAccessToken.js";
import { verifyAdmin } from "../middlewares/userRoleMiddleware.js";

const router = express.Router();

router
  .get("/areas", verifyAccessToken, verifyAdmin, getAreasAdmin)
  .get("/info/:areaId", verifyAccessToken, verifyAdmin, getTableInfo)
  .get("/info/search/:query", verifyAccessToken, verifyAdmin, searchDeceaseds)
  .get("/personnel", verifyAccessToken, verifyAdmin, getPersonnel)
  .get(
    "/personnel/guest/:query",
    verifyAccessToken,
    verifyAdmin,
    searchForGuests
  )
  .patch(
    "/info/update",
    verifyAccessToken,
    verifyAdmin,
    updateNotWithIntermentStatus
  )
  .patch(
    "/info/update/interment",
    verifyAccessToken,
    verifyAdmin,
    updateInterment
  )
  .patch(
    "/personnel/assign/:id",
    verifyAccessToken,
    verifyAdmin,
    updateGuestAsEmployee
  )
  .patch(
    "/personnel/assign/employee/:id",
    verifyAccessToken,
    verifyAdmin,
    assignRole
  );

export default router;
