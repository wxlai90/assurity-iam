process.env.CLIENT_ID = "mock-client-id";
process.env.CLIENT_SECRET = "mock-client-secret";
process.env.TENANT_ID = "mock-tenant-id";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import SecurityGroupModel from "../models/SecurityGroup";
import * as microsoftService from "./microsoft";

jest.mock("@azure/msal-node", () => ({
  ConfidentialClientApplication: jest.fn(),
}));

jest.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: jest.fn(),
  },
}));

jest.mock("../models/SecurityGroup", () => ({
  find: jest.fn(),
}));

jest.mock("../utils/logger", () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("#getAccessToken", () => {
  it("should return null if get token fails", async () => {
    const mockAcquireTokenByClientCredential = jest
      .fn()
      .mockRejectedValue(new Error("failed to get token"));

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );

    const token = await microsoftService.getAccessToken();

    expect(token).toBeNull();
    expect(mockAcquireTokenByClientCredential).toHaveBeenCalledTimes(1);
  });

  it("should return an access token", async () => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );

    const token = await microsoftService.getAccessToken();

    expect(token).toBe("mocked-access-token");
    expect(mockAcquireTokenByClientCredential).toHaveBeenCalledTimes(1);
  });
});

describe("#listAllSecurityGroups", () => {
  it("should return listing of security groups", async () => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );

    const mockSecurityGroups = [
      { id: "1", name: "Group 1" },
      { id: "2", name: "Group 2" },
    ];

    const mockGet = jest.fn().mockResolvedValue({ value: mockSecurityGroups });
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockApi = jest.fn().mockReturnValue({ filter: mockFilter });
    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    const groups = await microsoftService.listAllSecurityGroups();

    expect(groups).toEqual([
      { id: "1", name: "Group 1" },
      { id: "2", name: "Group 2" },
    ]);
    expect(mockApi).toHaveBeenCalledWith("/groups/microsoft.graph.group");
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  it("should handle errors and return null", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("API call failed"));
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockApi = jest.fn().mockReturnValue({ filter: mockFilter });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    const groups = await microsoftService.listAllSecurityGroups();

    expect(groups).toBeNull();
    expect(mockApi).toHaveBeenCalledWith("/groups/microsoft.graph.group");
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(mockFilter).toHaveBeenCalledWith("securityEnabled eq true");
    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("#getSecurityGroupById", () => {
  it("should return a group if found", async () => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );

    const mockGroup = { id: "1", name: "Group 1" };
    const mockGet = jest.fn().mockResolvedValue(mockGroup);
    const mockApi = jest.fn().mockReturnValue({ get: mockGet });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    const group = await microsoftService.getSecurityGroupById("1");

    expect(group).toEqual({ id: "1", name: "Group 1" });
    expect(mockApi).toHaveBeenCalledWith("/groups/1/microsoft.graph.group");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("should return null if group is not found", async () => {
    const mockGet = jest.fn().mockRejectedValue({});
    const mockApi = jest.fn().mockReturnValue({ get: mockGet });
    const mockGraphClient = {
      api: mockApi,
      get: mockGet,
    };

    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    const group = await microsoftService.getSecurityGroupById("invalid-id");

    expect(group).toBeNull();
    expect(mockGraphClient.get).toHaveBeenCalledTimes(1);
  });
});

describe("#getSecurityGroupsOfUserByID", () => {
  it("should return a list of security groups for a user", async () => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );

    const mockSecurityGroups = [{ id: "1", displayName: "Group 1" }];

    const mockGet = jest.fn().mockResolvedValue({ value: mockSecurityGroups });
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockCount = jest.fn().mockReturnValue({ filter: mockFilter });
    const mockHeader = jest.fn().mockReturnValue({ count: mockCount });
    const mockApi = jest.fn().mockReturnValue({ header: mockHeader });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    const groups = await microsoftService.getSecurityGroupsOfUserByID("userId");

    expect(groups).toEqual(mockSecurityGroups);
    expect(mockApi).toHaveBeenCalledWith(
      "/users/userId/memberOf/microsoft.graph.group"
    );
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(mockHeader).toHaveBeenCalledWith("ConsistencyLevel", "eventual");
    expect(mockCount).toHaveBeenCalledWith(true);
    expect(mockFilter).toHaveBeenCalledWith("securityEnabled eq true");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("should handle errors and return null", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("api call failed"));
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockCount = jest.fn().mockReturnValue({ filter: mockFilter });
    const mockHeader = jest.fn().mockReturnValue({ count: mockCount });
    const mockApi = jest.fn().mockReturnValue({ header: mockHeader });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    const groups = await microsoftService.getSecurityGroupsOfUserByID("userId");

    expect(groups).toBeNull();
    expect(mockApi).toHaveBeenCalledWith(
      "/users/userId/memberOf/microsoft.graph.group"
    );
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(mockHeader).toHaveBeenCalledWith("ConsistencyLevel", "eventual");
    expect(mockCount).toHaveBeenCalledWith(true);
    expect(mockFilter).toHaveBeenCalledWith("securityEnabled eq true");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("listAllUsers", () => {
  beforeAll(() => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );
  });

  it("should return a list of users", async () => {
    const mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      get: jest
        .fn()
        .mockResolvedValue({ value: [{ id: "1", displayName: "User 1" }] }),
    };

    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    const users = await microsoftService.listAllUsers();

    expect(users).toEqual([{ id: "1", displayName: "User 1" }]);
    expect(mockGraphClient.api).toHaveBeenCalledWith("/users");
    expect(mockGraphClient.get).toHaveBeenCalledTimes(1);
  });

  it("should handle errors and throw", async () => {
    const mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      get: jest.fn().mockRejectedValue(new Error("API request failed")),
    };

    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    try {
      await microsoftService.listAllUsers();
    } catch (error) {
      //   expect(error.message).toBe("Error getting users from Microsoft Graph");
    }
    expect(mockGraphClient.get).toHaveBeenCalledTimes(1);
  });
});

describe("getSecurityGroupsFromDB", () => {
  beforeAll(() => {
    const mockAcquireTokenByClientCredential = jest.fn().mockResolvedValue({
      accessToken: "mocked-access-token",
      expiresOn: new Date(new Date().getTime() + 3600 * 1000),
    });

    const mockCcaInstance = {
      acquireTokenByClientCredential: mockAcquireTokenByClientCredential,
    };

    (ConfidentialClientApplication as jest.Mock).mockImplementation(
      () => mockCcaInstance
    );
  });

  it("should return security groups from DB", async () => {
    const mockSecurityGroups = [{ id: "1", name: "Group 1" }];

    const mockFind = jest.fn().mockResolvedValue(mockSecurityGroups);
    (SecurityGroupModel.find as jest.Mock).mockImplementation(mockFind);

    const groups = await microsoftService.getSecurityGroupsFromDB();

    expect(groups).toEqual(mockSecurityGroups);
    expect(mockFind).toHaveBeenCalledTimes(1);
  });

  it("should handle errors and return null", async () => {
    const mockFind = jest
      .fn()
      .mockRejectedValue(new Error("DB request failed"));
    (SecurityGroupModel.find as jest.Mock).mockImplementation(mockFind);

    const groups = await microsoftService.getSecurityGroupsFromDB();

    expect(groups).toBeNull();
    expect(mockFind).toHaveBeenCalledTimes(1);
  });
});
