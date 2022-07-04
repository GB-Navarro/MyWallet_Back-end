import express from 'express';
import { postEntry, getEntry } from '../controllers/dataController.js';

const dataRouter = express.Router();

dataRouter.post("/entry", postEntry);

dataRouter.get("/entry", getEntry);

export default dataRouter;