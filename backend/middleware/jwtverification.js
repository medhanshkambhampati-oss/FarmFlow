const jwt = require('jsonwebtoken')
const Farmer = require('../models/Farmer')
require('dotenv').config()

const verifytoken = async(req,res,next) => {
    try {
        const t = req.headers.token;
        if(!t){
            return res.status(200).send("Token is Required");
        }
        const decodded = jwt.verify(t,process.env.JWT_SECRET);
        const f = await Farmer.findById(decodded.fid);
        console.log(decodded.fid)
        if(!f){
            return res.status(200).send("Token is invalid")
        }
        req.fid = decodded.fid;
        next();
    } catch (error) {
        console.log("Error at Middleware verification",error)
        return res.status(400).send("Internal Server Error")
    }
    
}

module.exports = verifytoken;