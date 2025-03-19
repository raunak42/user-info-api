// src/routes/userDataRoutes.ts
import express from "express";
import { sendUserDataToSheet, sendUserDataWlpToSheet } from "../controllers/userDataController";

const router = express.Router();

router.post("/send-user-data", sendUserDataToSheet);
router.post("/send-user-data-wlp", sendUserDataWlpToSheet);


export { router as userDataRouter };