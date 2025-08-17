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
export { app }