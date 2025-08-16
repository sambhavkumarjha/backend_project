import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// import dotenv from "dotenv";
// dotenv.config({
//     path:'/env'
// })
const connectDb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("database connected !! , DB-Host: ", connectionInstance.connection.host);
    } catch (error) {
        console.error("Mongodb connection error: ", error);
        //throw error;
        process.exit(1);
    }
}

export default connectDb;