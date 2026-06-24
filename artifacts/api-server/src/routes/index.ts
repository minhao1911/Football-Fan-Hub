import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import matchesRouter from "./matches";
import chatRouter from "./chat";
import forumRouter from "./forum";
import pokesRouter from "./pokes";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";
import feedRouter from "./feed";
import aiRouter from "./ai/index";
import pollsRouter from "./polls";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(matchesRouter);
router.use(chatRouter);
router.use(forumRouter);
router.use(pokesRouter);
router.use(predictionsRouter);
router.use(pollsRouter);
router.use(leaderboardRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(feedRouter);
router.use(aiRouter);

export default router;
