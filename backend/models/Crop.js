const mongoose = require('mongoose');

const cropschema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    farm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farm"
    },

    // Pre-harvest NPK (farm NPK before this crop was added)
    pn: Number,
    pp: Number,
    pk: Number,

    // Post-harvest NPK (predicted NPK after harvesting this crop)
    nn: Number,
    np: Number,
    nk: Number,

    recordedAt: {
        type: Date,
        default: Date.now
    }
});

const Crop = mongoose.model("Crop", cropschema);
module.exports = Crop;