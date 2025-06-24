import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import securityGroupRoutes from "./routes/securityGroupRoutes";
import userRoutes from "./routes/userRoutes";
import logger from "./utils/logger";

const app = express();
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/groups", securityGroupRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: "Not Found",
    message: `The requested URL ${req.originalUrl} is not found.`,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong. Please try again later.",
  });
});

export default app;
