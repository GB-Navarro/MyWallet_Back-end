//Ajeitar os scripts no package.json antes de entregar o projeto
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";

import calculateUserBalance from "./functions/calculateUserBalance.js";
import validateEntryData from "./functions/validateEntryData.js";
import validateUserDataFormat from "./functions/validateUserDataFormat.js";
import {
  validateRegistrationData,
  verifyUserExistence,
  createUserSession,
  getUserName,
  validateUserToken,
  finderUserEmail,
  findUserEntries,
} from "./models/user.js";

import { createNewUser } from "./models/user.js";

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


async function signUp(req, res) {
  let registrationData = req.body;
  if (await validateRegistrationData(registrationData)) {
    let newUserIsCreated = await createNewUser(registrationData);
    if (newUserIsCreated) {
      res.status(201).send("Ok!");
    } else {
      res.sendStatus(500);
    }
  } else {
    res.status(422).send("Err!"); // O status e a mensagem não estão sendo enviados pro front
  }
}

async function signIn(req, res) {
  let userData = req.body;
  if (validateUserDataFormat(userData)) {
    if (await verifyUserExistence(userData)) {
      let userToken = uuid();
      let userSessionsHasCreated = await createUserSession(userData, userToken);
      if (userSessionsHasCreated) {
        let response = {
          name: await getUserName(userData),
          token: userToken,
        };
        res.status(200).send(response);
      } else {
        res.status(422).send("O usuário já tem uma sessão ativa");
      }
    } else {
      console.log("O usuário não existe no banco de dados");
      res.sendStatus(401);
    }
  } else {
    console.log("O formato de algum dos dados de login não é válido");
    res.sendStatus(422);
  }
}

async function postEntry(req, res) {
  let data = req.body;
  let config = req.headers.authorization;
  let isUserDataValid = validateEntryData(data);
  let isUserTokenValid = await validateUserToken(config, data.email);
  if (isUserDataValid && isUserTokenValid) {
    let promisse = await db.collection("entryExit").insertOne(data);
    if (promisse.acknowledged) {
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
  try {
    let promisse = await db.collection("sessions").deleteOne({ token: token });
    res.send("Ok!");
  } catch (error) {
    console.log("Ocorreu um erro ao deslogar o usuário", error);
  }
}
