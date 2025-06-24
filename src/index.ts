import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app";
import logger from "./utils/logger";

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
  }
};

connectToDatabase();

app.listen(port, () => {
  logger.info(`Listening on ${port}`);
});
