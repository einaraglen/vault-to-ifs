import { Router, Request, Response } from 'express';

export const router: Router = Router();

router.get("/test", (req: Request, res: Response) => {
    const headers = req.headers;
    res.send({ message: "this is a test endpoint" })
})
