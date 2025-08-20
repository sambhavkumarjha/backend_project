import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))
// basic security practices
app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))//to store the pdfs , images etc at the server itself

app.use(cookieParser())// to perform crud operations on user's browser


//routes import

import userRouter from "./routes/user.routes.js";

//routes declaration
// app.get("/api/v1",(req,res)=>{
//     res.send("hello")
// })
app.use("/api/v1/users",userRouter);
// http://localhost:8000/api/v1/users/register

export { app }