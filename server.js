import express from "express";
import morgan from "morgan";
import cors  from "cors";
import mongoose from "mongoose";
// database
import {DATABASE} from './config.js';

import dotenv from "dotenv"

import authRoutes from "./routes/auth.js";

const app = express();

// db connect
mongoose.connect(DATABASE)
    .then(()=>console.log('db_connected'))
    .catch((err)=>console.log(err));

//Middleware
app.use(express.json());
app.use(morgan("dev"));     
app.use(cors())

// const dotenv= require('dotenv')
 dotenv.config({path: ".env"})


// Routes middlewares
app.use("/api", authRoutes);


app.listen(5500, ()=> console.log("server runing in port 5500"));

   