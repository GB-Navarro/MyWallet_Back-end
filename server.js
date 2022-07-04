import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";


import calculateUserBalance from "./functions/calculateUserBalance.js";
import validateEntryData from "./functions/validateEntryData.js";
import validateUserDataFormat from "./functions/validateUserDataFormat.js";
import {
  createNewUser,
  validateRegistrationData,
  verifyUserExistence,
  createUserSession,
  getUserName,
  validateUserToken,
  finderUserEmail,
  findUserEntries,
  sendUserEntry,
  sendLogOutRequisition
} from "./models/user.js";

import { signUp, signIn } from "./controllers/authController.js"

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





async function postEntry(req, res) {
  let data = req.body;
  let config = req.headers.authorization;
  let isUserDataValid = validateEntryData(data);
  let isUserTokenValid = await validateUserToken(config, data.email);
  if (isUserDataValid && isUserTokenValid) {
    let result = await sendUserEntry(data);
    if (result) {
      res.status(200).send("Os dados foram enviados com sucesso");
    }
  } else {
    res.status(422).send("Os dados inseridos não são válidos!");
  }
}


async function getEntry(req, res) {
  let token = req.headers.authorization;
  let userEmail = await finderUserEmail(token);
  if (userEmail != undefined) {
    let isTokenValid = await validateUserToken(token, userEmail);
    let userEntries = await findUserEntries(userEmail);
    if (userEntries.length > 0) {
      if (isTokenValid) {
        let response = {
          userEntries: await findUserEntries(userEmail),
          balance: calculateUserBalance(userEntries),
        };
        res.status(200).send(response);
      } else {
        res.status(422).send("O token do usuário é inválido!");
      }
    } else {
      res.status(200).send([]);
    }
  } else {
    res.status(404).send("O usuário não existe");
  }
}

async function logOut(req, res) {
  let token = req.headers.authorization;
  let result = await sendLogOutRequisition(token);
  if(result){
    res.send("Ok!");
  }else{
    console.log("Ocorreu um erro ao deslogar o usuário");
  }
}


