import { Request, Response } from "express";
import { HTTP_ERRORS, HTTP_MESSAGES } from "../consts/errors";
import { HTTP_INTERNAL_SERVER_ERROR, HTTP_OK } from "../consts/http-statuses";
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

    res.status(HTTP_OK).json({ success: true, data: users });
  } catch (error) {
    logger.error("Error getting users:", { error });
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      error: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES.FAILED_TO_GET_USERS,
      data: null,
    });
  }
};

export const getUserGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const groups = await getSecurityGroupsOfUserByID(req.params.userId);

    res.status(HTTP_OK).json({ success: true, data: groups });
  } catch (error) {
    logger.error(`Error getting users for user ID ${req.params.userId}:`, {
      error,
    });
    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      success: false,
      error: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES.FAILED_TO_GET_GROUPS_FOR_USER,
    });
  }
};
