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

let registrationData = {
    name:"",
    email:"",
    password:"",
    confirmPassword:""
}

const registrationDataSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().min(5).email({minDomainSegments: 2, tlds:{allow: ['com']}}).required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().min(8).required()
    //usar regex aqui (junto com o Joi) pra que as senhas criadas sejam obrigatoriamente senhas fortes
    //usar regex pra que os nomes sejam criados apenas com caracteres
    //estudar mais sobre validações de email e aplicar aqui
})

app.post("/sign-up", (req, res) => {
    let registrationData = req.body;
    if(validateRegistrationData(registrationData)){
        //db.collection("users").insertOne();
        res.send("Hello World !");
    }else{
        console.log()
        res.sendStatus(422);
    }
})

app.listen(5000);

function validateRegistrationData(registrationData){
    let isValid;
    if(registrationDataSchema.validate(registrationData).error === undefined){
        if(registrationData.password === registrationData.confirmPassword){
            isValid = true;
            return isValid;
        }   
    }else{
        isValid = false;
        return isValid;
    }
}