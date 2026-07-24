const express = require('express')
const {reg,log,getProfile} = require('../controller/FarmerController')
const verify = require('../middleware/jwtverification')
const router = express.Router();


router.post("/login",log);
router.post("/register",reg);
router.get("/profile",verify,getProfile);


module.exports = router