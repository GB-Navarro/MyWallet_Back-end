import express from "express";
import cors from "cors";

import { signUp, signIn, logOut } from "./controllers/authController.js"
import {postEntry, getEntry} from "./controllers/dataController.js"

const app = express();

app.use(express.json());
app.use(cors());

app.post("/sign-up", signUp);

app.post("/sign-in", signIn);

app.post("/entry", postEntry);

app.get("/entry", getEntry);

app.delete("/home", logOut);

app.listen(5000);










