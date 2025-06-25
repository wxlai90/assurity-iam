import mongoose from "mongoose";
import app from "./app";
import logger from "./utils/logger";

jest.spyOn(app, "listen").mockImplementation((port, callback) => {
  return {
    close: jest.fn(),
  } as any;
});

jest.spyOn(logger, "info").mockImplementation();

jest.mock("mongoose", () => ({
  connect: jest.fn(),
  Schema: jest.fn(),
  model: jest.fn(),
}));

describe("#connectToDatabase", () => {
  it("should connect to mongodb", () => {
    process.env.MONGO_URI = "mongodb_uri";
    require("./index");

    expect(mongoose.connect).toHaveBeenCalledWith("mongodb_uri");
  });
});
