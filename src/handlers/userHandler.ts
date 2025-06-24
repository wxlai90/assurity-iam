import { Request, Response } from "express";
import {
  getSecurityGroupsOfUserByID,
  listAllUsers,
} from "../services/microsoft";
import logger from "../utils/logger";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await listAllUsers();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error("Error getting users:", { error });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get users",
    });
  }
};

export const getUserGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const groups = await getSecurityGroupsOfUserByID(req.params.userId);

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    logger.error(`Error getting users for user ID ${req.params.userId}:`, {
      error,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get user groups",
    });
  }
};
