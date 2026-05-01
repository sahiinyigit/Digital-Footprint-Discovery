import { Router, type IRouter } from "express";
import healthRouter from "./health";
import osintRouter from "./osint/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/osint", osintRouter);

export default router;
