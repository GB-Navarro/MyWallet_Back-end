import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import { registrationDataSchema, tokenSchema } from "./../schemas/schemas.js"
import filterUserEntries from "./../functions/filterUserEntries.js";

dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URL);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("myWallet");
});

export async function createNewUser(registrationData) {
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

export async function validateRegistrationData(registrationData) {
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
        "Ocorreu um erro na validação",
        schemaError
      );
      isValid = false;
      return isValid;
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

  export async function verifyUserExistence(user) {
    const wantedUser = await db
      .collection("users")
      .findOne({ email: user.email });
  
    let userExists;
  
    if (wantedUser != null) {
      const userEmailExists = await wantedUser.email;
      const wantedUserPassword = await wantedUser.password;
      const isPasswordEqual = bcrypt.compareSync(
        user.password,
        wantedUserPassword
      );
  
      if (userEmailExists === null) {
        userExists = false;
        return userExists;
      } else {
        if (isPasswordEqual) {
          userExists = true;
          return userExists;
        }
      }
    } else {
      userExists = false;
      return userExists;
    }
  }

  export async function createUserSession(userData, userToken) {
    let { email, password } = userData;
    let user = {
      token: userToken,
      email: email,
      password: password,
    };
    let userHasAActiveSession = await checkIfUserHasAActiveSession(user.email);
    let isCreated;
    if (!userHasAActiveSession) {
      let promisse = await db.collection("sessions").insertOne(user);
      if (promisse.acknowledged) {
        isCreated = true;
        return isCreated; // a sessão do usuário foi criada
      } else {
        isCreated = false;
        return isCreated; // ocorreu um problema ao criar a sessão do usuário
      }
    } else {
      isCreated = false;
      return isCreated; // o usuário já possui uma sessão ativa
    }
  }

  async function checkIfUserHasAActiveSession(userEmail) {
    let promisse = await db.collection("sessions").findOne({ email: userEmail });
    let userHasAActiveSession;
    if (promisse === null) {
      userHasAActiveSession = false;
      return userHasAActiveSession;
    } else {
      userHasAActiveSession = true;
      return userHasAActiveSession;
    }
  }

  export async function getUserName(user) {
    let wantedUser = await db.collection("users").findOne({ email: user.email });
    let userName = wantedUser.name;
    return userName;
  }

  export async function validateUserToken(token, email) {
    let isTokenFormatValid;
    let tokenExists;
    let isTokenValid;
    let search = await db.collection("sessions").findOne({ token: token });
    if (tokenSchema.validate(token).error === undefined) {
      isTokenFormatValid = true;
    } else {
      isTokenFormatValid = false;
    }
    if (search != null) {
      tokenExists = true;
    } else {
      tokenExists = false;
    }
    if (isTokenFormatValid && tokenExists) {
      if (email === search.email) {
        isTokenValid = true;
        return isTokenValid;
      } else {
        isTokenValid = false;
        return isTokenValid;
      }
    } else {
      isTokenValid = false;
      return isTokenValid;
    }
  }

  export async function finderUserEmail(token) {
    let userEmail;
    let searchUser = await db.collection("sessions").findOne({ token: token });
    if (searchUser != null) {
      userEmail = searchUser.email;
      return userEmail;
    } else {
      userEmail = undefined;
      return userEmail;
    }
  }

  export async function findUserEntries(userEmail) {
    let searchEntries = await db
      .collection("entryExit")
      .find({ email: userEmail })
      .toArray();
    let userEntries = [];
    if (searchEntries != null && searchEntries != undefined) {
      userEntries = filterUserEntries(searchEntries);
      return userEntries;
    } else {
      return userEntries;
    }
  }
  