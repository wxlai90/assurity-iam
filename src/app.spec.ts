import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import request from "supertest";
import app from "./app";
import { HTTP_ERRORS, HTTP_MESSAGES } from "./consts/errors";
import SecurityGroupModel from "./models/SecurityGroup";
import * as microsoft from "./services/microsoft";

jest.mock("./utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest
  .spyOn(microsoft, "listAllSecurityGroups")
  .mockResolvedValue([{ id: "1", name: "a", securityEnabled: true }]);

jest.mock("./models/SecurityGroup");

describe("#app", () => {
  describe("groups handler", () => {
    it("should return groups with 200 status", async () => {
      const response = await request(app)
        .get("/api/v1/groups")
        .expect("Content-Type", /json/)
        .expect(200);

      const spy = jest
        .spyOn(SecurityGroupModel, "bulkWrite")
        .mockImplementation();

      expect(spy).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { id: "1" },
            update: { $set: { id: "1", name: "a", securityEnabled: true } },
            upsert: true,
          },
        },
      ]);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: "1", name: "a", securityEnabled: true },
      ]);
    });

    it("should return early if there are no groups", async () => {
      jest.resetAllMocks();

      const response = await request(app)
        .get("/api/v1/groups")
        .expect("Content-Type", /json/)
        .expect(200);

      jest.spyOn(microsoft, "listAllSecurityGroups").mockResolvedValue([]);

      const spy = jest
        .spyOn(SecurityGroupModel, "bulkWrite")
        .mockImplementation();

      expect(spy).not.toHaveBeenCalled();
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it("should return error if there were errors saving to db", async () => {
      jest
        .spyOn(microsoft, "listAllSecurityGroups")
        .mockResolvedValue([{ id: "1", name: "a", securityEnabled: true }]);

      const spy = jest
        .spyOn(SecurityGroupModel, "bulkWrite")
        .mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/v1/groups")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(spy).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { id: "1" },
            update: { $set: { id: "1", name: "a", securityEnabled: true } },
            upsert: true,
          },
        },
      ]);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toEqual(HTTP_ERRORS.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toEqual(
        HTTP_MESSAGES.FAILED_TO_FETCH_AND_SAVE_SECURITY_GROUPS
      );
    });

    it("should return groups info from db if exists", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupsFromDB")
        .mockResolvedValue([
          { id: "1", name: "a", securityEnabled: true } as any,
        ]);

      const response = await request(app)
        .get("/api/v1/groups/db")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: "1", name: "a", securityEnabled: true },
      ]);
    });

    it("should return not found if groups data do not exist in db", async () => {
      jest.spyOn(microsoft, "getSecurityGroupsFromDB").mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/groups/db")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        HTTP_MESSAGES.NO_SECURITY_GROUPS_IN_DATABASE
      );
    });

    it("should return error status and null if there was error reading from db", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupsFromDB")
        .mockRejectedValue(new Error("DB error"));

      const response = await request(app)
        .get("/api/v1/groups/db")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual(
        HTTP_MESSAGES.FAILED_TO_FETCH_GROUPS_FROM_DATABASE
      );
    });

    it("should return group details by id", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupById")
        .mockResolvedValue([
          { id: "1", name: "a", securityEnabled: true },
        ] as MicrosoftGraph.Group);

      const response = await request(app)
        .get("/api/v1/groups/groupId/details")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        { id: "1", name: "a", securityEnabled: true },
      ]);
      expect(response.body.message).toBeNull();
    });

    it("should return not found if there was no group of `id`", async () => {
      jest.spyOn(microsoft, "getSecurityGroupById").mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/groups/groupId/details")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toEqual(
        `Security group with ID "groupId" not found`
      );
    });

    it("should return error if there was error getting group by id", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupById")
        .mockRejectedValue(new Error("error getting group by id"));

      const response = await request(app)
        .get("/api/v1/groups/groupId/details")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual("Failed to get security group");
    });
  });

  describe("users handler", () => {
    it("should return users with 200 status", async () => {
      jest
        .spyOn(microsoft, "listAllUsers")
        .mockResolvedValue([{ id: "1", name: "a" }]);

      const response = await request(app)
        .get("/api/v1/users")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([{ id: "1", name: "a" }]);
    });

    it("should return error when unable to get users", async () => {
      jest
        .spyOn(microsoft, "listAllUsers")
        .mockRejectedValue(new Error("error getting users"));

      const response = await request(app)
        .get("/api/v1/users")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toEqual("Failed to get users");
    });

    it("should return user groups by userId", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupsOfUserByID")
        .mockResolvedValue([{ id: "1" }]);

      const response = await request(app)
        .get("/api/v1/users/1/groups")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([{ id: "1" }]);
    });

    it("should return error if unable to get user groups by userId", async () => {
      jest
        .spyOn(microsoft, "getSecurityGroupsOfUserByID")
        .mockRejectedValue(new Error("unable to get user groups"));

      const response = await request(app)
        .get("/api/v1/users/1/groups")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toEqual("Internal Server Error");
      expect(response.body.message).toEqual("Failed to get groups for user");
    });
  });

  describe("GET invalid route", () => {
    it("should return 404 if the route is incorrect", async () => {
      const response = await request(app)
        .get("/api/v1/non-existing-route")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "The requested URL /api/v1/non-existing-route is not found."
      );
    });
  });
});
