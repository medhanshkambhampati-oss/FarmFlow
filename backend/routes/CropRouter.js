const express = require("express");
const router = express.Router();
const verify = require("../middleware/jwtverification");

const {
    addCrop,
    deleteCrop,
    getCropsByFarm,
    getCostAnalysis
} = require("../controller/CropController");

// Add crop to a farm (predicts post-harvest NPK and updates farm)
router.post("/addcrop", verify, addCrop);

// Delete crop from a farm (recalculates farm NPK)
router.post("/deletecrop", verify, deleteCrop);

// Get all crops for a farm (sorted by date, latest first)
router.get("/getcrops/:farmId", verify, getCropsByFarm);

// Cost analysis
router.get("/cost/:farmId", getCostAnalysis);

module.exports = router;