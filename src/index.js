import connectDb from "./db/index.js";
import { app } from "./app.js";
// require('dotenv').config({
//     path:'./env'
// })

import dotenv from "dotenv";
dotenv.config({
    path:'./.env'
})

const port = process.env.PORT|| 4000;
connectDb()
.then(()=>{
    app.listen(port,()=>{
        console.log(`App is running on ${port}`);
    })
})
.catch((err)=>{
    console.log("Database connection failed !!! ", err);
})











// import express from "express"
// always during connection of the application with database 
// we should wrap the entire code in try-catch blocks or in the form of promises as there are huge chances of error
// second there are generally two ways of database connection is practiced in professional approach 
// first inside the index.js file itself we write the connection code ,second we should write our piece of connection code in separate folder named as 'db' for better readability
// also we should always use async await which means database connection is an asynchronous process as there is a significance distance between the codebase location and the database actual location
/* fuction connectDb(){
}
connectDb();

2. iffe
;(async()=>{})() initial semicolon is just for taking precautions if the previous line is not ending with semicolon or not*/
/*
const app = express();
(async ()=> {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}
        /${DB_NAME}`)
        app.on("error",(error)=>{
            console.error("Not able to talk to the database due to : ",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("Error: ",error );
        throw error;
    }
})()*/
