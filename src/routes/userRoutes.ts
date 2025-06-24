import { Router } from "express";
import { getAllUsers, getUserGroups } from "../handlers/userHandler";

const router = Router();

router.get("/", getAllUsers);
router.get("/:userId/groups", getUserGroups);

export default router;
