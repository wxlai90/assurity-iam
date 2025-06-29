import { ConfidentialClientApplication } from "@azure/msal-node";
import {
  Client,
  GraphRequest,
  PageIterator,
  PageIteratorCallback,
} from "@microsoft/microsoft-graph-client";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import SecurityGroupModel from "../models/SecurityGroup";
import logger from "../utils/logger";

let cachedResult: { accessToken: string; expiresOn: Date } | null = null;

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
  },
};

const logError = (message: string, error: unknown) => {
  logger.error(`${message}: ${JSON.stringify(error)}`);
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedResult && cachedResult.expiresOn > new Date())
    return cachedResult.accessToken;

  try {
    const cca = new ConfidentialClientApplication(msalConfig);

    const result = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    if (result && result.accessToken && result.expiresOn) {
      cachedResult = {
        accessToken: result.accessToken,
        expiresOn: result.expiresOn,
      };

      return cachedResult.accessToken;
    }

    logError("Failed to get access token", result);
    return null;
  } catch (error) {
    logError("Error getting access token:", error);
    return null;
  }
};

const getGraphClient = async (): Promise<Client | null> => {
  const token = await getAccessToken();
  if (!token) {
    logger.error("Error getting access token");
    return null;
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });

  return client;
};

// https://learn.microsoft.com/en-us/graph/sdks/paging?tabs=typescript
export const getAllItems = async <T>(
  client: Client,
  graphRequest: GraphRequest
): Promise<T[] | null> => {
  const results: T[] = [];
  const callback: PageIteratorCallback = (message: T) => {
    results.push(message);
    return true;
  };

  try {
    const response = await graphRequest.get();
    const pageIterator = new PageIterator(client, response, callback);

    await pageIterator.iterate();
    return results;
  } catch (error) {
    logger.error(`Error getting items from graph api`, error);
    return null;
  }
};

export const listAllSecurityGroups = async () => {
  const client = await getGraphClient();
  if (!client) return null;

  try {
    const graphRequest = await client
      .api("/groups/microsoft.graph.group")
      .filter("securityEnabled eq true");

    const results = await getAllItems<MicrosoftGraph.Group>(
      client,
      graphRequest
    );

    return results;
  } catch (error) {
    logError("Error getting security groups", error);
    return null;
  }
};

export const getSecurityGroupById = async (
  groupId: string
): Promise<MicrosoftGraph.Group | null> => {
  const client = await getGraphClient();
  if (!client) return null;

  try {
    const group: MicrosoftGraph.Group = await client
      .api(`/groups/${groupId}/microsoft.graph.group`)
      .get();

    return group;
  } catch (error) {
    logError(`Error getting security group with ID ${groupId}`, error);
    return null;
  }
};

export const getSecurityGroupsOfUserByID = async (
  userId: string
): Promise<MicrosoftGraph.Group[] | null> => {
  const client = await getGraphClient();
  if (!client) return null;

  try {
    const graphRequest = client
      .api(`/users/${userId}/memberOf/microsoft.graph.group`)
      .header("ConsistencyLevel", "eventual")
      .count(true)
      .filter("securityEnabled eq true");

    const results = await getAllItems<MicrosoftGraph.Group>(
      client,
      graphRequest
    );

    return results;
  } catch (error) {
    logError(`Error getting security groups for user ${userId}`, error);
    return null;
  }
};

export const listAllUsers = async (): Promise<MicrosoftGraph.User[] | null> => {
  const client = await getGraphClient();
  if (!client) return null;

  try {
    const graphRequest = client.api("/users");
    const results = await getAllItems<MicrosoftGraph.User>(
      client,
      graphRequest
    );

    return results;
  } catch (error) {
    logError("Error getting users with security groups", error);
    return null;
  }
};

export const getSecurityGroupsFromDB = async () => {
  try {
    const securityGroups = await SecurityGroupModel.find({});
    return securityGroups;
  } catch (error) {
    logError("Error getting security groups from DB", error);
    return null;
  }
};
