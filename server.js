

//Ajeitar os scripts no package.json antes de entregar o projeto
// CRIAR A SESSÃO DO USUÁRIO
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { join } from "path";

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



const entrySchema = Joi.object({
  email: Joi.string().min(1).required(),
  type: Joi.string().min(1).required(),
  value: Joi.string().min(1).required(),
  description: Joi.string().min(1).required()
})

const tokenSchema = Joi.string().required().min(1);


app.post("/sign-up", signUp);

app.post("/sign-in", signIn);

app.post("/entry", postEntry);
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

function validateUserDataFormat(user) {
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

  let userExists;

  if(wantedUser != null){
    const userEmailExists = await wantedUser.email;
    const wantedUserPassword = await wantedUser.password;
    const isPasswordEqual = bcrypt.compareSync(user.password, wantedUserPassword);

    if (userEmailExists === null) {
      userExists = false;
      return userExists;
    } else {
      if(isPasswordEqual){
        userExists = true;
        return userExists;
      } 
    }
  }else{
    userExists = false;
    return userExists;
  }
}

async function createUserSession(userData,userToken){
    let {email, password} = userData;
    let user = {
        token: userToken,
        email: email,
        password: password
    }
    let userHasAActiveSession = await checkIfUserHasAActiveSession(user.email);
    let isCreated;
    if(!userHasAActiveSession){
      let promisse = await db.collection("sessions").insertOne(user);
      if(promisse.acknowledged){
          isCreated = true;
          return isCreated // a sessão do usuário foi criada
      }else{
          isCreated = false;
          return isCreated; // ocorreu um problema ao criar a sessão do usuário
      }
    }else{
      isCreated = false;
      return isCreated; // o usuário já possui uma sessão ativa
    }
    
    
}

async function checkIfUserHasAActiveSession(userEmail){
  let promisse = await db.collection("sessions").findOne({email: userEmail});
  let userHasAActiveSession;
  if(promisse === null){
    userHasAActiveSession = false;
    return userHasAActiveSession
  }else{
    userHasAActiveSession = true;
    return userHasAActiveSession;
  }
}

async function getUserName(user){
  let wantedUser = await db.
  collection("users").
  findOne({email: user.email});
  let userName = wantedUser.name;
  return userName;
}

async function signUp(req, res){
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

async function signIn(req, res){
    let userData = req.body;
    if (validateUserDataFormat(userData)) {
      if (await verifyUserExistence(userData)) {
        let userToken = uuid();
        let userSessionsHasCreated = await createUserSession(userData, userToken);
        if(userSessionsHasCreated){
          let response = {
            name: await getUserName(userData),
            token: userToken
          }
          res.status(200).send(response);
        }else{
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
    // Testes a fazer
    // 1 - Verificar o formato em que os dados chegam do front-end (usar o userDataSchema) - Ok!
    // 2 - Conferir se o usuário enviado pelo front existe no banco de dados - Ok!
    // 3 - Verificar se a sessão do usuário foi criada no banco de dados
}

async function postEntry(req, res){
  let data = req.body;
  let config = req.headers.authorization;
  let isUserDataValid = validateEntryData(data);
  let isUserTokenValid = await validateUserToken(config, data.email);
  if(isUserDataValid && isUserTokenValid){
    let promisse = await db.collection("entryExit").insertOne(data);
    if(promisse.acknowledged){
      console.log("Os dados foram enviados com sucesso");
    }
  }else{
    console.log("Os dados inseridos não são válidos!");
  }
}



function validateEntryData(data){
  let isDataValid = entrySchema.validate(data).error;
  if(isDataValid === undefined){
    return true;
  }else{
    return false;
  }
}

async function validateUserToken(token, email){
  let isTokenFormatValid;
  let tokenExists;
  let isTokenValid;
  let search = await db.collection("sessions").findOne({token: token})

  if(tokenSchema.validate(token).error === undefined){
    isTokenFormatValid = true;
  }else{
    isTokenFormatValid = false;
  }
  if(search != null){
    tokenExists = true;
  }else{
    tokenExists = false;
  }
  if(isTokenFormatValid && tokenExists){
    if(email === search.email){
      isTokenValid = true;
      return isTokenValid;
    }else{
      isTokenValid = false;
      return isTokenValid
    }
  }else{
    isTokenValid = false;
    return isTokenValid;
  }
}