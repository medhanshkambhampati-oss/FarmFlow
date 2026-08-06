const Farmer = require('../models/Farmer')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const reg = async (req, res) => {
    const { name, email, pass } = req.body || {};
    if (!name || !email || !pass) {
        res.status(400).send({ "status": "error", "mssg": "name,email and password all are required" });
    }
    try {
        const f = await Farmer.findOne({ email: email })
        if (f) {
            res.status(200).send({ "status": "error", "mssg": "Already Have an account" });
        } else {
            const hp = await bcrypt.hash(pass, 16)
            const nf = new Farmer({
                name,
                email,
                password: hp,
            })
            const farmer = await nf.save();
            res.status(200).send({ "status": "success", "mssg": "Account created Successfully" });
        }
    } catch (error) {
        console.log("Error in Registration", error)
        res.status(400).send({ "status": "error", "mssg": "Internal Server Error" });
    }
}

const log = async (req, res) => {
    const { email, pass } = req.body || {};
    if (!email || !pass) {
        return res.status(400).send("Both Email and password are required");
    }
    try {
        const ce = await Farmer.findOne({ email: email });
        if (!ce) {
            return res.status(200).send({ "status": "error", "mssg": "Account not Found" });
        } else {
            if (await bcrypt.compare(pass, ce.password)) {
                const t = jwt.sign({ fid: ce._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
                return res.status(200).send({ "status": "success", "mssg": "Login Success", "token": t, "name": ce.name, "email": ce.email });
            } else {
                return res.status(200).send({ "status": "error", "mssg": "Incorrect Password" });
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(400).send({ "status": "error", "mssg": "Internal Server Error" });
    }
}

const getProfile = async (req, res) => {
    try {
        const f = await Farmer.findById(req.fid).select('name email -_id');
        if (!f) {
            return res.status(404).send({ "status": "error", "mssg": "User not found" });
        }
        return res.status(200).send({ "status": "success", "name": f.name, "email": f.email });
    } catch (error) {
        console.log("Error in getProfile", error)
        return res.status(400).send({ "status": "error", "mssg": "Internal Server Error" });
    }
}

module.exports = { reg, log, getProfile }