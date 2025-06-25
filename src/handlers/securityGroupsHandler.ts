import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Request, Response } from "express";
import { HTTP_ERRORS, HTTP_MESSAGES } from "../consts/errors";
import {
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
  HTTP_OK,
} from "../consts/http-statuses";
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

    if (!graphGroups || graphGroups.length === 0) {
      res.status(HTTP_OK).json({
        success: true,
        data: [],
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

    const result = await SecurityGroupModel.bulkWrite(bulkOperations);
    res.status(HTTP_OK).json({ success: true, data: graphGroups });
  } catch (error) {
    logger.error(
      "Error fetching and saving security groups from Microsoft Graph:",
      {
        error,
      }
    );
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      error: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES.FAILED_TO_FETCH_AND_SAVE_SECURITY_GROUPS,
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
      res.status(HTTP_NOT_FOUND).json({
        success: false,
        message: `Security group with ID "${req.params.groupId}" not found`,
        data: [],
      });

      return;
    }

    res
      .status(HTTP_OK)
      .json({ success: true, data: groupDetails, message: null });
  } catch (error) {
    logger.error(
      `Error fetching details for security group ${req.params.groupId}:`,
      { error }
    );
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      error: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES.FAILED_TO_FETCH_SECURITY_GROUP,
      data: null,
    });
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

      res.status(HTTP_NOT_FOUND).json({
        success: false,
        message: HTTP_MESSAGES.NO_SECURITY_GROUPS_IN_DATABASE,
        data: null,
      });

      return;
    }

    res.status(HTTP_OK).json({ success: true, data: groups });
  } catch (error) {
    logger.error("Error fetching security groups from DB:", { error });

    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      error: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES.FAILED_TO_FETCH_GROUPS_FROM_DATABASE,
      data: null,
    });
  }
};
