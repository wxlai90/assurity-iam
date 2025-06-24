import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Request, Response } from "express";
import SecurityGroupModel from "../models/SecurityGroup";
import {
  getSecurityGroupById,
  getSecurityGroupsFromDB,
  listAllSecurityGroups,
} from "../services/microsoft";
import logger from "../utils/logger";

export const getAllSecurityGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const graphGroups: MicrosoftGraph.Group[] | null =
      await listAllSecurityGroups();

    // early return if no security groups found
    if (!graphGroups || graphGroups.length === 0) {
      res.status(200).json({
        success: true,
        data: graphGroups,
      });

      return;
    }

    const bulkOperations = graphGroups.map(
      (graphGroup: MicrosoftGraph.Group) => {
        return {
          updateOne: {
            filter: { id: graphGroup.id },
            update: { $set: graphGroup },
            upsert: true,
          },
        };
      }
    );

    await SecurityGroupModel.bulkWrite(bulkOperations);
    res.status(200).json({ success: true, data: graphGroups });
  } catch (error) {
    logger.error("Error fetching security groups from Microsoft Graph:", {
      error,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch and save security groups from Microsoft Graph",
    });
  }
};

export const getSecurityGroupDetailsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const groupDetails = await getSecurityGroupById(req.params.groupId);

    if (!groupDetails) {
      logger.warn(`Security group with ID "${req.params.groupId}" not found`);
      res.status(404).json({
        success: false,
        message: `Security group with ID "${req.params.groupId}" not found`,
      });

      return;
    }

    res.status(200).json({ success: true, data: groupDetails });
  } catch (error) {
    logger.error(
      `Error fetching details for security group ${req.params.groupId}:`,
      { error }
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const handleGetSecurityGroupsFromDB = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const groups = await getSecurityGroupsFromDB();

    if (!groups || groups.length === 0) {
      logger.warn("No security groups found in the database");

      res.status(404).json({
        success: false,
        message: "No security groups found in the database",
      });

      return;
    }

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    logger.error("Error fetching security groups from DB:", { error });

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch security groups from mongodb",
    });
  }
};
