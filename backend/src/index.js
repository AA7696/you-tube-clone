import express from 'express'
import connectDB from './db/connect.js';
import dotenv from 'dotenv'

const app = express();

dotenv.config({
    path:  "./config/.env"
})









const start = async () =>{
    try {
        await connectDB(process.env.MONGODB_URI)
        app.listen(process.env.PORT,() =>{
            console.log("Server is connected");
        })
    } catch (error) {
        console.log(error);     
    }
}

start();





