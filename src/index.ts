// src/server.ts - Main server file
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { userDataRouter } from "./routes/userDataRoutes";

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/", userDataRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;