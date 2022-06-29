import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";

dotenv.config()

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URL);

let db;
mongoClient.connect().then(() => {
    db = mongoClient.db("myWallet"); //conferir se já foi criado.
})

app.use(express.json());
app.use(cors());

let registrationData = {
    name:"",
    email:"",
    password:"",
    confirmPassword:""
}
// preciso desse objeto aqui ?

const registrationDataSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().min(5).email({minDomainSegments: 2, tlds:{allow: ['com']}}).required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().min(8).required()
    //usar regex aqui (junto com o Joi) pra que as senhas criadas sejam obrigatoriamente senhas fortes
    //usar regex pra que os nomes sejam criados apenas com caracteres
    //estudar mais sobre validações de email e aplicar aqui
})

//criptografar a senha antes de enviar pro banco de dados (usar a lib becrypt)
//não criar usuário com mesmo nome ou email
app.post("/sign-up", async (req, res) => {
    let registrationData = req.body;
    if( await validateRegistrationData(registrationData)){
        let newUserIsCreated = await createNewUser(registrationData);
        if(newUserIsCreated){
            res.sendStatus(201);
        }else{
            res.sendStatus(500);
        }
    }else{
        res.sendStatus(422);
    }
})

app.listen(5000);

async function validateRegistrationData(registrationData){
    let isValid;
    if(registrationDataSchema.validate(registrationData).error === undefined){
        if(registrationData.password === registrationData.confirmPassword){
            let {name, email} = registrationData;
            if(( await checkNameExistence(name)) && ( await checkEmailExistence(email))){
                isValid = true;
                return isValid;
            }else{
                console.log("Já existe um usuário cadastrado que possui o mesmo nome ou o mesmo e-mail");
                isValid = false;
                return isValid;
            }
        }else{
            console.log("As senhas não coincidem")
            isValid = false;
            return isValid;
        }
    }else{
        let schemaError = registrationDataSchema.validate(registrationData).error
        console.log("Ocorreu um erro na validação usando a biblioteca Joi", schemaError);
        isValid = false;
        return isValid;
    }
}

async function createNewUser(registrationData){
    let {name, email, password} = registrationData;
    let newUser = {
        name: name,
        email: email,
        password: password
    }
    let promisse = await db.collection("users").insertOne(newUser);
    let isCreated = promisse.acknowledged;
    if(isCreated){
        return true;
    }else{
        return false;
    }
}

async function checkEmailExistence(wantedEmail){
    let users = await db.collection("users").find().toArray();
    let isEmailValid;
    if(users.find((user) => user.email === wantedEmail) === undefined){
        isEmailValid = true;
        return isEmailValid;
    }else{
        isEmailValid = false;
        return isEmailValid;
    }
}

async function checkNameExistence(wantedName){
    let users = await db.collection("users").find().toArray();
    let isNameValid;
    if(users.find((user) => user.name === wantedName) === undefined){
        isNameValid = true;
        return isNameValid;
    }else{
        isNameValid = false;
        return isNameValid;
    }
}