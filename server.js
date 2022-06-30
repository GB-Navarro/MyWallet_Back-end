//Ajeitar os scripts no package.json antes de entregar o projeto

import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URL);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("myWallet");
});

app.use(express.json());
app.use(cors());

let registrationData = {
  name: "",
  email: "",
  password: "",
  confirmedPassword: "",
};
// preciso desse objeto aqui ?

const registrationDataSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string()
    .min(5)
    .email({ minDomainSegments: 2, tlds: { allow: ["com"] } })
    .required(),
  password: Joi.string().min(8).required(),
  confirmedPassword: Joi.string().min(8).required(),
  //usar regex aqui (junto com o Joi) pra que as senhas criadas sejam obrigatoriamente senhas fortes
  //usar regex pra que os nomes sejam criados apenas com caracteres
  //estudar mais sobre validações de email e aplicar aqui
});

const userDataSchema = Joi.object({
  email: Joi.string()
    .min(5)
    .email({ minDomainSegments: 2, tlds: { allow: ["com"] } })
    .required(),
  password: Joi.string().min(8).required(),
});
app.post("/sign-up", async (req, res) => {
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
});

app.post("/sign-in", async (req, res) => {
  let userData = req.body;
  if (verifyUserDataFormat(userData)) {
    if (await verifyUserExistence(userData)) {
      let userToken = uuid();
      if(createUserSession(userData, userToken)){
        let response = {
          name: await getUserName(userData),
          token: userToken
        }
        res.status(200).send(response);
      }
    } else {
      console.log("O usuário não existe no banco de dados");
      res.sendStatus(401);
    }
  } else {
    console.log("O formato de algum dos dados de login não é válido");
    res.sendStatus(422);
  }
  // Testes a fazer
  // 1 - Verificar o formato em que os dados chegam do front-end (usar o userDataSchema)
  // 2 - Conferir se o usuário enviado pelo front existe no banco de dados
  // 3 - Verificar se a sessão do usuário foi criada no banco de dados
});

app.listen(5000);

async function validateRegistrationData(registrationData) {
  let isValid;
  let validationResult =
    registrationDataSchema.validate(registrationData).error === undefined;
  if (validationResult) {
    if (registrationData.password === registrationData.confirmedPassword) {
      let { name, email } = registrationData;
      if (
        (await checkNameExistence(name)) &&
        (await checkEmailExistence(email))
      ) {
        isValid = true;
        return isValid;
      } else {
        console.log(
          "Já existe um usuário cadastrado que possui o mesmo nome ou o mesmo e-mail"
        );
        isValid = false;
        return isValid;
      }
    } else {
      console.log("As senhas não coincidem");
      isValid = false;
      return isValid;
    }
  } else {
    let schemaError = registrationDataSchema.validate(registrationData).error;
    console.log(
      "Ocorreu um erro na validação usando a biblioteca Joi",
      schemaError
    );
    isValid = false;
    return isValid;
  }
}

async function createNewUser(registrationData) {
  let { name, email, password } = registrationData;
  let newUser = {
    name: name,
    email: email,
    password: bcrypt.hashSync(password, 10),
  };
  let promisse = await db.collection("users").insertOne(newUser);
  let isCreated = promisse.acknowledged;
  if (isCreated) {
    return true;
  } else {
    return false;
  }
}

async function checkEmailExistence(wantedEmail) {
  let users = await db.collection("users").find().toArray();
  let isEmailValid;
  if (users.find((user) => user.email === wantedEmail) === undefined) {
    isEmailValid = true;
    return isEmailValid;
  } else {
    isEmailValid = false;
    return isEmailValid;
  }
}

async function checkNameExistence(wantedName) {
  let users = await db.collection("users").find().toArray();
  let isNameValid;
  if (users.find((user) => user.name === wantedName) === undefined) {
    isNameValid = true;
    return isNameValid;
  } else {
    isNameValid = false;
    return isNameValid;
  }
}

function verifyUserDataFormat(user) {
  let validationResult = userDataSchema.validate(user).error === undefined;
  let isValid;
  if (validationResult) {
    isValid = true;
    return isValid;
  } else {
    isValid = false;
    return isValid;
  }
}

async function verifyUserExistence(user) {
  const wantedUser = await db
    .collection("users")
    .findOne({ email: user.email });

  const userEmailExists = await wantedUser.email;
  const wantedUserPassword = await wantedUser.password;
  const isPasswordEqual = bcrypt.compareSync(user.password, wantedUserPassword);

  let userExists;

  if (userEmailExists === null) {
    userExists = false;
    return userExists;
  } else {
    if(isPasswordEqual){
      userExists = true;
      return userExists;
    } 
  }
}

async function createUserSession(userData,userToken){
    let {email, password} = userData;
    let user = {
        token: userToken,
        email: email,
        password: password
    }
    let isCreated;
    let promisse = await db.collection("sessions").insertOne(user);
    if(promisse.acknowledged){
        isCreated = true;
        return isCreated
    }else{
        isCreated = false;
        return isCreated;
    }
}

async function getUserName(user){
  let wantedUser = await db.
  collection("users").
  findOne({email: user.email});
  let userName = wantedUser.name;
  return userName;
}