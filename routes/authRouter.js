import express from 'express';
import { signUp, signIn, logOut } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post("/sign-up", signUp);

authRouter.post("/sign-in", signIn);

authRouter.delete("/home", logOut);

export default authRouter;