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