const mongoose = require('mongoose')
const Crop = require('./Crop')
const Farmer = require('./Farmer')

const farmschema = mongoose.Schema({
    name:{
        type:String
    },
    size:{
        type:Number
    },
    n:{
        type:Number
    },
    p:{
        type:Number
    },
    k:{
        type:Number
    },
    fn:{
        type:Number
    },
    fp:{
        type:Number
    },
    fk:{
        type:Number
    },
    ph:{
        type:Number
    },
    temparatue:{
        type:Number
    },
    humidity:{
        type:Number
    },
    rainfall:{
        type:Number
    },
    lat:{
        type:String,
        required:true
    },
    lan:{
        type:String,
        required:true
    },
    locname:{
        type:String
    },
    crops:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Crop"
    }],
    farmers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farmer"
    }]
})

const Farm = mongoose.model("Farm",farmschema);
module.exports = Farm