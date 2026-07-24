const mongoose = require('mongoose')
const Farm = require('./Farm')

const farmerschema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String
    },
    farms:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm"
    }]
})

const Farmer = mongoose.model("Farmer",farmerschema);
module.exports = Farmer