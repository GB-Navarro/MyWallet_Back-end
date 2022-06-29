import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";

dotenv.config()

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URL);

mongoClient.connect().then(() => {
    let db = mongoClient.db("myWallet"); //conferir se já foi criado.
})

app.use(express.json());
app.use(cors());

//let 

app.post("/sign-up", (req, res) => {
    res.send("Hello World !");
})

app.listen(5000);