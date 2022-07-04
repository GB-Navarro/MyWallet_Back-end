import validateEntryData from "../functions/validateEntryData.js";
import calculateUserBalance from "../functions/calculateUserBalance.js";
import { validateUserToken, sendUserEntry, finderUserEmail, findUserEntries } from "../models/user.js";
export async function postEntry(req, res) {
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
  
export async function getEntry(req, res) {
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