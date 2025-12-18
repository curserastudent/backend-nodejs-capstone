require("dotenv").config();
import express, { json } from "express";
import cors from "cors";
import { info } from "./logger";
import connectToDatabase from "./models/db";
const app = express();
app.use("*", cors());
const port = 3060;

// Connect to MongoDB; we just do this one time
connectToDatabase()
  .then(() => {
    info("Connected to DB");
  })
  .catch((e) => console.error("Failed to connect to DB", e));

app.use(json());

// Route files

// authRoutes Step 2: import the authRoutes and store in a constant called authRoutes
import authRoutes from "./routes/authRoutes";

// Items API Task 1: import the secondChanceItemsRoutes and store in a constant called secondChanceItemsRoutes
import secondChanceItemsRoutes from "./routes/secondChanceItemsRoutes";

// Search API Task 1: import the searchRoutes and store in a constant called searchRoutes
import searchRoutes from "./routes/searchRoutes";

import pinoHttp from "pino-http";
import logger from "./logger";

app.use(pinoHttp({ logger }));

// Use Routes
// authRoutes Step 2: add the authRoutes and to the server by using the app.use() method.
app.use("/api/auth", authRoutes);

// Items API Task 2: add the secondChanceItemsRoutes to the server by using the app.use() method.
app.use("/api/secondchance/items", secondChanceItemsRoutes);

// Search API Task 2: add the searchRoutes to the server by using the app.use() method.
app.use("/api/secondchance/search", searchRoutes);

// Global Error Handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.get("/", (req, res) => {
  res.send("Inside the server");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
