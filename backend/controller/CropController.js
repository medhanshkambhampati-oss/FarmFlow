const axios = require("axios");
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");

// Add a crop to a farm
// 1. Fetch current farm fn, fp, fk (current NPK)
// 2. Call Python ML backend to predict post-harvest NPK
// 3. Create crop with pre (current farm NPK) and post (predicted) NPK values
// 4. Update farm fn, fp, fk to the post-harvest values
const addCrop = async (req, res) => {
    try {
        const { farmId, cname } = req.body;

        if (!farmId || !cname) {
            return res.status(400).json({ status: "error", msg: "Farm ID and crop name are required" });
        }

        const farm = await Farm.findById(farmId);
        if (!farm) {
            return res.status(404).json({ status: "error", msg: "Farm not found" });
        }

        // Current NPK values of the farm (these are the "pre-harvest" values for this crop)
        const preN = farm.fn ?? farm.n ?? 0;
        const preP = farm.fp ?? farm.p ?? 0;
        const preK = farm.fk ?? farm.k ?? 0;

        // Call Python ML backend to predict post-harvest NPK values
        let postN, postP, postK;
        try {
            const response = await axios.post("https://farmflow-75rr.onrender.com/predict_post_harvest", {
                crop: cname,
                n: preN,
                p: preP,
                k: preK,
            });

            postN = response.data.nn ?? preN;
            postP = response.data.np ?? preP;
            postK = response.data.nk ?? preK;
        } catch (mlError) {
            console.log("ML prediction failed, using estimated values:", mlError.message);
            // Fallback: estimate post-harvest NPK (crop consumes some nutrients)
            postN = Math.max(0, preN - Math.floor(Math.random() * 20 + 10));
            postP = Math.max(0, preP - Math.floor(Math.random() * 10 + 5));
            postK = Math.max(0, preK - Math.floor(Math.random() * 15 + 8));
        }

        // Create the crop record with pre and post NPK values
        const crop = new Crop({
            name: cname,
            farm: farm._id,
            pn: preN,
            pp: preP,
            pk: preK,
            nn: postN,
            np: postP,
            nk: postK,
        });

        await crop.save();

        // Add crop to farm's crop list
        farm.crops.push(crop._id);

        // Update farm's current NPK to post-harvest values
        farm.fn = postN;
        farm.fp = postP;
        farm.fk = postK;

        await farm.save();

        res.status(200).json({
            status: "success",
            msg: "Crop added successfully",
            crop,
            updatedFarmNPK: { fn: postN, fp: postP, fk: postK },
        });
    } catch (err) {
        console.error("Error adding crop:", err);
        res.status(500).json({ status: "error", msg: "Server Error" });
    }
};

// Delete a crop from a farm
// Recalculates farm NPK by replaying all remaining crops in chronological order
const deleteCrop = async (req, res) => {
    try {
        const { cropId, farmId } = req.body;

        if (!cropId || !farmId) {
            return res.status(400).json({ status: "error", msg: "Crop ID and Farm ID are required" });
        }

        const farm = await Farm.findById(farmId);
        if (!farm) {
            return res.status(404).json({ status: "error", msg: "Farm not found" });
        }

        const crop = await Crop.findById(cropId);
        if (!crop) {
            return res.status(404).json({ status: "error", msg: "Crop not found" });
        }

        // Remove crop from farm's list
        farm.crops = farm.crops.filter((c) => c.toString() !== cropId);

        // Delete the crop document
        await Crop.findByIdAndDelete(cropId);

        // Recalculate farm NPK
        if (farm.crops.length > 0) {
            // Get remaining crops sorted by date (oldest first = chronological order)
            const remainingCrops = await Crop.find({ farm: farmId }).sort({ recordedAt: 1 });

            if (remainingCrops.length > 0) {
                // Start from the original NPK values
                let currentN = farm.n;
                let currentP = farm.p;
                let currentK = farm.k;

                // Replay each crop's effect: recalculate pre/post NPK
                for (let i = 0; i < remainingCrops.length; i++) {
                    const c = remainingCrops[i];
                    // Update this crop's pre-harvest to current values
                    c.pn = currentN;
                    c.pp = currentP;
                    c.pk = currentK;

                    // Recalculate post-harvest via Python ML
                    try {
                        const response = await axios.post("https://farmflow-75rr.onrender.com/predict_post_harvest", {
                            crop: c.name,
                            n: currentN,
                            p: currentP,
                            k: currentK,
                        });
                        c.nn = response.data.nn ?? currentN;
                        c.np = response.data.np ?? currentP;
                        c.nk = response.data.nk ?? currentK;
                    } catch (mlErr) {
                        console.log("ML recalc failed for", c.name);
                        console.log(mlErr.message);
                    }

                    // Move to next crop's starting point
                    currentN = c.nn;
                    currentP = c.np;
                    currentK = c.nk;

                    await c.save();
                }

                // Farm's final NPK = last crop's post-harvest
                farm.fn = currentN;
                farm.fp = currentP;
                farm.fk = currentK;
            }
        } else {
            // No crops left, reset to original NPK
            farm.fn = farm.n;
            farm.fp = farm.p;
            farm.fk = farm.k;
        }

        await farm.save();

        res.status(200).json({
            status: "success",
            msg: "Crop deleted successfully",
            updatedFarmNPK: { fn: farm.fn, fp: farm.fp, fk: farm.fk },
        });
    } catch (err) {
        console.error("Error deleting crop:", err);
        res.status(500).json({ status: "error", msg: "Server Error" });
    }
};

// Get all crops for a farm sorted by date (latest first)
const getCropsByFarm = async (req, res) => {
    try {
        const { farmId } = req.params;

        const farm = await Farm.findById(farmId);
        if (!farm) {
            return res.status(404).json({ status: "error", msg: "Farm not found" });
        }

        // Query by farm field for reliability, fallback to crops array
        const crops = await Crop.find({ farm: farmId }).sort({ recordedAt: -1 });

        res.status(200).json({
            status: "success",
            crops,
        });
    } catch (err) {
        console.error("Error fetching crops:", err);
        res.status(500).json({ status: "error", msg: "Server Error" });
    }
};

const getCostAnalysis = async (req, res) => {
    try {
        const { farmId } = req.params;

        const farm = await Farm.findById(farmId);
        if (!farm) {
            return res.status(404).json({ msg: "Farm not found" });
        }

        const response = await axios.post("http://127.0.0.1:5000/cost_analysis", {
            size: farm.size,
            n: farm.n,
            p: farm.p,
            k: farm.k,
            rainfall: farm.rainfall,
        });

        res.json({
            msg: "Cost analysis fetched successfully",
            cost: response.data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

module.exports = { addCrop, deleteCrop, getCropsByFarm, getCostAnalysis };