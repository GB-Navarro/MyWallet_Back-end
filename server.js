import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

import { signUp, signIn, logOut } from "./controllers/authController.js"
import {postEntry, getEntry} from "./controllers/dataController.js"

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URL);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("myWallet");
});

app.use(express.json());
app.use(cors());

app.post("/sign-up", signUp);

app.post("/sign-in", signIn);

app.post("/entry", postEntry);

app.get("/entry", getEntry);

app.delete("/home", logOut);

app.listen(5000);










