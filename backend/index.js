const express = require('express')
const mongoose = require('mongoose')
const FarmerController = require('./routes/FarmerRouter')
const FarmController = require('./routes/FarmRouter')
const CropController = require('./routes/CropRouter')
const AuthController = require('./routes/AuthRouter')
const cors = require('cors');
const app = express();
require('dotenv').config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        // Add your production URLs here when deploying
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token', 'Authorization'],
}));


app.use((req,res,next)=>{
    console.log(req.path," ",req.method);
    next();
})

app.use("/farmer",FarmerController);

app.use("/farm",FarmController);

app.use('/crop',CropController)

app.use('/auth',AuthController)




app.use("/",(req,res)=>{
    res.send("App Started Successfully")
})



mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("App Started Successfully")
    })
})
.catch((e)=>{
    console.log("Error Connecting Mongo DB",e)
})


