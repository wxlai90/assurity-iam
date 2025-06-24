import { Router } from "express";
import {
  getAllSecurityGroups,
  getSecurityGroupDetailsById,
  handleGetSecurityGroupsFromDB,
} from "../handlers/securityGroupsHandler";

const router = Router();

router.get("/", getAllSecurityGroups);
router.get("/:groupId/details", getSecurityGroupDetailsById);
router.get("/db", handleGetSecurityGroupsFromDB);

export default router;
