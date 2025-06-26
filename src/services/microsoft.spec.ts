process.env.CLIENT_ID = "mock-client-id";
process.env.CLIENT_SECRET = "mock-client-secret";
process.env.TENANT_ID = "mock-tenant-id";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client, GraphRequest } from "@microsoft/microsoft-graph-client";
import SecurityGroupModel from "../models/SecurityGroup";
import * as microsoftService from "./microsoft";

const successTokenMock = jest.fn().mockResolvedValue({
  accessToken: "mocked-access-token",
  expiresOn: new Date(new Date().getTime() + 3600 * 1000),
});
const failedTokenMock = jest
  .fn()
  .mockRejectedValue(new Error("failed to get access token"));

let currentTokenMock = successTokenMock;

jest.mock("@azure/msal-node", () => ({
  ConfidentialClientApplication: jest.fn().mockImplementation(() => {
    return {
      acquireTokenByClientCredential: currentTokenMock,
    };
  }),
}));

let apiFn = jest.fn(() => ({
  filter: jest.fn(),
}));

jest.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: jest.fn(() => ({
      api: apiFn,
    })),
  },
  PageIterator: jest.fn().mockImplementation((client, response, callback) => {
    return {
      iterate: async () => {
        response.value.forEach(callback);
      },
    };
  }),
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
    currentTokenMock = failedTokenMock;
    const token = await microsoftService.getAccessToken();

    expect(token).toBeNull();
    expect(failedTokenMock).toHaveBeenCalledTimes(1);
  });

  it("should return an access token", async () => {
    currentTokenMock = successTokenMock;
    const token = await microsoftService.getAccessToken();

    expect(token).toBe("mocked-access-token");
    expect(successTokenMock).toHaveBeenCalledTimes(1);
  });
});

describe("#getAllItems", () => {
  it("should return all items when the graph request is successful", async () => {
    const client = {
      init: jest.fn(() => ({
        api: jest.fn(() => {}),
      })),
    } as unknown as Client;

    const graphRequest = {
      get: jest.fn().mockResolvedValue({
        value: [1, 2, 3],
        "@odata.nextLink":
          "https://graph.microsoft.com/v1.0/users?$top=5&$skiptoken=RFNwdAIAAQAAAD8...AAAAAAAA",
      }),
    } as unknown as GraphRequest;

    const result = await microsoftService.getAllItems(client, graphRequest);
    expect(result).toEqual([1, 2, 3]);
  });

  it("should return empty array when no items are returned", async () => {
    const client = {
      init: jest.fn(() => ({
        api: jest.fn(() => {}),
      })),
    } as unknown as Client;

    const graphRequest = {
      get: jest.fn().mockResolvedValue({
        value: [],
      }),
    } as unknown as GraphRequest;

    const result = await microsoftService.getAllItems(client, graphRequest);

    expect(result).toEqual([]);
    expect(result).toEqual([]);
  });

  it("should handle errors and return null", async () => {
    const client = {
      init: jest.fn(() => ({
        api: jest.fn(() => {}),
      })),
    } as unknown as Client;

    const graphRequest = {
      get: jest.fn().mockRejectedValue(new Error("api call failed")),
    } as unknown as GraphRequest;

    const result = await microsoftService.getAllItems(client, graphRequest);

    expect(result).toBeNull();
  });
});

describe("#listAllSecurityGroups", () => {
  currentTokenMock = successTokenMock;

  it("should return listing of security groups", async () => {
    const mockGroup = [
      { id: "1", name: "Group 1" },
      { id: "2", name: "Group 2" },
    ];

    jest.mock("@azure/msal-node", () => {
      return {
        ConfidentialClientApplication: jest.fn().mockImplementation(() => {
          return {
            acquireTokenByClientCredential: successTokenMock,
          };
        }),
      };
    });

    const spy = jest
      .spyOn(microsoftService, "getAllItems")
      .mockResolvedValue(mockGroup);

    const groups = await microsoftService.listAllSecurityGroups();

    expect(groups).toEqual([
      { id: "1", name: "Group 1" },
      { id: "2", name: "Group 2" },
    ]);
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    spy.mockReset();
  });

  it("should handle errors and return null", async () => {
    apiFn = jest.fn(() => ({
      filter: jest.fn(() => ({
        get: jest.fn().mockRejectedValue(new Error("API call failed")),
      })),
    }));

    const spy = jest
      .spyOn(microsoftService, "getAllItems")
      .mockRejectedValue(new Error("API call failed"));

    const groups = await microsoftService.listAllSecurityGroups();

    expect(groups).toBeNull();
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    spy.mockReset();
  });
});

describe("#getSecurityGroupById", () => {
  it("should return a group if found", async () => {
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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return a list of security groups for a user", async () => {
    const mockSecurityGroups = [{ id: "1", displayName: "Group 1" }];

    const mockGet = jest.fn().mockResolvedValue({ value: mockSecurityGroups });
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockCount = jest.fn().mockReturnValue({ filter: mockFilter });
    const mockHeader = jest.fn().mockReturnValue({ count: mockCount });
    const mockApi = jest.fn().mockReturnValue({ header: mockHeader });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    jest
      .spyOn(microsoftService, "getAllItems")
      .mockResolvedValue(mockSecurityGroups);

    const groups = await microsoftService.getSecurityGroupsOfUserByID("userId");

    expect(groups).toEqual(mockSecurityGroups);
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    expect(mockHeader).toHaveBeenCalledWith("ConsistencyLevel", "eventual");
    expect(mockCount).toHaveBeenCalledWith(true);
    expect(mockFilter).toHaveBeenCalledWith("securityEnabled eq true");
  });

  it("should handle errors and return null", async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error("api call failed"));
    const mockFilter = jest.fn().mockReturnValue({ get: mockGet });
    const mockCount = jest.fn().mockReturnValue({ filter: mockFilter });
    const mockHeader = jest.fn().mockReturnValue({ count: mockCount });
    const mockApi = jest.fn().mockReturnValue({ header: mockHeader });

    (Client.init as jest.Mock).mockReturnValue({ api: mockApi });

    jest
      .spyOn(microsoftService, "getAllItems")
      .mockRejectedValue(new Error("api call failed"));

    const groups = await microsoftService.getSecurityGroupsOfUserByID("userId");

    expect(groups).toBeNull();
    expect(mockApi).toHaveBeenCalledWith(
      "/users/userId/memberOf/microsoft.graph.group"
    );
    expect(mockApi).toHaveBeenCalledTimes(1);
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    expect(mockHeader).toHaveBeenCalledWith("ConsistencyLevel", "eventual");
    expect(mockCount).toHaveBeenCalledWith(true);
    expect(mockFilter).toHaveBeenCalledWith("securityEnabled eq true");
  });
});

describe("#listAllUsers", () => {
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return a list of users", async () => {
    const mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      get: jest
        .fn()
        .mockResolvedValue({ value: [{ id: "1", displayName: "User 1" }] }),
    };

    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    jest
      .spyOn(microsoftService, "getAllItems")
      .mockResolvedValue([{ id: "1", displayName: "User 1" }]);

    const users = await microsoftService.listAllUsers();

    expect(users).toEqual([{ id: "1", displayName: "User 1" }]);
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    expect(mockGraphClient.api).toHaveBeenCalledWith("/users");
  });

  it("should handle errors and return null", async () => {
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

    const mockGet = jest.fn().mockResolvedValue([]);
    const mockApi = jest.fn().mockReturnValue({ get: mockGet });

    const mockGraphClient = { api: mockApi };
    (Client.init as jest.Mock).mockReturnValue(mockGraphClient);

    jest
      .spyOn(microsoftService, "getAllItems")
      .mockRejectedValue(new Error("API call failed"));

    const users = await microsoftService.listAllUsers();

    expect(users).toBeNull();
    expect(microsoftService.getAllItems).toHaveBeenCalledTimes(1);
    expect(microsoftService.getAllItems).toHaveBeenCalledWith(mockGraphClient, {
      get: mockGet,
    });
  });
});

describe("#getSecurityGroupsFromDB", () => {
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
