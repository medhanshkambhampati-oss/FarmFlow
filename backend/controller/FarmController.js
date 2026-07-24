const axios = require('axios')
const Farm = require('../models/Farm')
const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');

const addfarm = async (req, res) => {
    const { lat, lan, name, size, locname, n, p, k } = req.body || {};

    if (!lat || !lan || !name || !size || !locname) {
        return res.status(200).send("Location is Required");
    }
    try {
        const f = await Farmer.findById(req.fid);
        if (!f) {
            return res.status(200).send({ "status": "error", "mssg": "Farmer not found" })
        }
        const farm = new Farm({
            name,
            size,
            locname,
            lat,
            lan,
            locname,
            n, p, k, fn: n, fp: p, fk: k,
            farmers: f._id
        })
        const ffarm = await farm.save();
        f.farms.push(ffarm._id);
        await f.save();
        return res.status(200).send({ "mssg": "Farm added Successfully" })
    } catch (error) {
        console.log("Error at Add Farm", error)
        return res.status(400).send("Internal Server Error")
    }
}




const cropPrediction = async (req, res) => {
    const { farmId, n, p, k, ph, temperature, humidity, rainfall } = req.body;

    try {

        if (!farmId) {
            return res.status(400).send({
                status: "error",
                msg: "Farm ID is required"
            });
        }

        const farm = await Farm.findById(farmId);

        if (!farm) {
            return res.status(404).send({
                status: "error",
                msg: "Farm not found"
            });
        }

        // Use values from request body first, fallback to farm DB values
        const soilN = Number(n) || Number(farm.n);
        const soilP = Number(p) || Number(farm.p);
        const soilK = Number(k) || Number(farm.k);
        const soilPh = Number(ph) || Number(farm.ph);

        if (!soilN || !soilP || !soilK) {
            return res.status(400).send({
                status: "error",
                msg: "Please fill N, P, and K values before prediction"
            });
        }

        let avgTemp, avgHumidity, avgRain;

        if (temperature && humidity && rainfall) {

            avgTemp = Number(temperature);
            avgHumidity = Number(humidity);
            avgRain = Number(rainfall);

        }
        else {

            // Try to fetch live weather; fall back to Indian averages if it fails
            try {
                const lat = farm.lat;
                const lon = farm.lan;
                const API_KEY = process.env.WEATHER_API_KEY || process.env.VISUAL_KEY;

                if (!lat || !lon || !API_KEY) throw new Error("Missing weather config");

                const weatherUrl =
                    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&include=days&key=${API_KEY}&contentType=json`;

                const weatherResponse = await axios.get(weatherUrl, { timeout: 8000 });
                const days = weatherResponse.data?.days?.slice(0, 180);

                if (!days || days.length === 0) throw new Error("No weather days returned");

                let temp = 0, hum = 0, rain = 0;
                days.forEach((d) => {
                    temp += Number(d.temp) || 0;
                    hum += Number(d.humidity) || 0;
                    rain += Number(d.precip) || 0;
                });

                avgTemp = temp / days.length;
                avgHumidity = Math.max(hum / days.length, 40);
                avgRain = rain / 6;

            } catch (weatherErr) {
                // Fall back to typical Indian agri-belt averages
                console.warn("Weather API failed, using fallback values:", weatherErr.message);
                avgTemp = 27;
                avgHumidity = 60;
                avgRain = 100;
            }
        }

        // Get current month for season detection
        const currentMonth = new Date().getMonth() + 1;

        const mlResponse = await axios.post(
            "http://127.0.0.1:5000/predict",
            {
                N: soilN,
                P: soilP,
                K: soilK,
                ph: soilPh,
                temperature: avgTemp,
                humidity: avgHumidity,
                rainfall: avgRain,
                month: currentMonth
            }
        );

        // Update farm soil values in DB
        farm.n = soilN;
        farm.p = soilP;
        farm.k = soilK;
        farm.ph = soilPh;
        await farm.save();

        return res.status(200).send({
            status: "success",
            ...mlResponse.data,
            weatherUsed: {
                temperature: Math.round(avgTemp * 10) / 10,
                humidity: Math.round(avgHumidity * 10) / 10,
                rainfall: Math.round(avgRain * 10) / 10
            },
            soilUsed: {
                n: soilN,
                p: soilP,
                k: soilK,
                ph: soilPh
            }
        });

    } catch (error) {

        console.log("Crop Prediction Error:", error.response?.data || error.message);

        return res.status(500).send({
            status: "error",
            msg: `Prediction failed: ${error.message}. ${error.response?.data?.error || ""}`
        });
    }
};

const updateSoilValues = async (req, res) => {

    const { farmId, n, p, k, ph, size } = req.body;

    try {

        const farm = await Farm.findById(farmId);

        if (!farm) {
            return res.status(404).send({
                status: "error",
                msg: "Farm not found"
            });
        }

        // Update original soil values (baseline)
        if (n !== undefined) { farm.n = Number(n); farm.fn = Number(n); }
        if (p !== undefined) { farm.p = Number(p); farm.fp = Number(p); }
        if (k !== undefined) { farm.k = Number(k); farm.fk = Number(k); }
        if (ph !== undefined) farm.ph = Number(ph);
        if (size !== undefined) farm.size = Number(size);

        await farm.save();

        return res.status(200).send({
            status: "success",
            msg: "Farm updated successfully",
            farm
        });

    } catch (error) {

        console.log("Error updating farm values:", error);

        return res.status(500).send({
            status: "error",
            msg: "Internal Server Error"
        });
    }
};


const getallfarmsbyid = async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.fid);
        if (!farmer) {
            return res.status(200).send({ "Status": "error", "mssg": "Token is Required" });
        }
        const farms = await Farm.find({ farmers: farmer._id })
        if (farms.length === 0) {
            return res.status(200).send({ "status": "success", "mssg": "No Products", "farms": farms })
        }
        return res.status(200).send({ "status": "success", "farms": farms })
    } catch (error) {
        console.log("error at getfarmsbyid", error);
        return res.status(400).send({ "status": "error", "mssg": "internal server error" })
    }
}

const getsinglefarmbyid = async (req, res) => {
    try {
        const farmId = req.params.id;
        const farmerId = req.fid;

        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return res.status(401).json({
                status: "error",
                message: "Please login first"
            });
        }


        const farm = await Farm.findOne({
            _id: farmId,
            farmers: farmerId
        })
            .populate("crops")
            .populate("farmers");


        if (!farm) {
            return res.status(403).json({
                status: "error",
                message: "Unauthorized access or farm not found"
            });
        }


        return res.status(200).json({
            status: "success",
            data: farm
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};


const delFarmById = async (req, res) => {
    try {
        const { delfarm } = req.body;

        if (!delfarm) {
            return res.status(400).send({ "mssg": "Farm ID is required" });
        }


        const farm = await Farm.findById(delfarm);
        if (!farm) {
            return res.status(404).send({ "mssg": "Farm not found" });
        }


        await Crop.deleteMany({ farm: delfarm });

        await Farm.findByIdAndDelete(delfarm);

        return res.status(200).send({ "mssg": "Farm and related crops deleted successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ "mssg": "Internal Server Error" });
    }
};

const yieldPrediction = async (req, res) => {
    const {
        farmId,
        crop_variety,
        seed_type,
        irrigation_type,
        use_fertilizer,
        fertilizer_n,
        fertilizer_p,
        fertilizer_k,
        soil_ph
    } = req.body;

    try {
        // ── Validate Farm ID ─────────────────────────────
        if (!farmId) {
            return res.status(400).json({
                status: "error",
                msg: "Farm ID is required"
            });
        }

        const farm = await Farm.findById(farmId);
        if (!farm) {
            return res.status(404).json({
                status: "error",
                msg: "Farm not found"
            });
        }

        // ── Weather Fetch (Past 6 Months) ────────────────
        const lat = farm.lat;
        const lon = farm.lan;
        const API_KEY = process.env.WEATHER_API_KEY || process.env.VISUAL_KEY;

        let weatherData = {
            temp_avg: 27,
            temp_min: 20,
            temp_max: 35,
            rainfall_mm: 800,
            sunshine_hours: 7,
            humidity: 65
        };

        if (lat && lon && API_KEY) {
            try {
                const today = new Date();
                const startDate = new Date();
                startDate.setDate(today.getDate() - 180);

                const startStr = startDate.toISOString().split("T")[0];
                const endStr = today.toISOString().split("T")[0];

                const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startStr}/${endStr}?unitGroup=metric&include=days&elements=temp,tempmin,tempmax,precip,humidity,sunhours&key=${API_KEY}&contentType=json`;

                const wRes = await axios.get(weatherUrl, { timeout: 10000 });
                const days = wRes.data?.days;

                if (Array.isArray(days) && days.length > 0) {
                    let sumTemp = 0,
                        sumTempMin = 0,
                        sumTempMax = 0,
                        sumRain = 0,
                        sumSunHours = 0,
                        sumHumidity = 0,
                        validSunDays = 0;

                    days.forEach((d) => {
                        sumTemp += Number(d?.temp) || 0;
                        sumTempMin += Number(d?.tempmin) || 0;
                        sumTempMax += Number(d?.tempmax) || 0;
                        sumRain += Number(d?.precip) || 0;
                        sumHumidity += Number(d?.humidity) || 0;

                        // ✅ Only use real sunhours
                        if (d?.sunhours !== undefined && d.sunhours !== null) {
                            sumSunHours += Number(d.sunhours) || 0;
                            validSunDays++;
                        }
                    });

                    const n = days.length;

                    weatherData = {
                        temp_avg: +(sumTemp / n).toFixed(1),
                        temp_min: +(sumTempMin / n).toFixed(1),
                        temp_max: +(sumTempMax / n).toFixed(1),

                        // ✅ Use average rainfall per day (better for ML)
                        rainfall_mm: +(sumRain / n).toFixed(1),

                        // ✅ Avoid wrong values if sunhours missing
                        sunshine_hours: validSunDays > 0
                            ? +(sumSunHours / validSunDays).toFixed(1)
                            : 7, // fallback realistic value

                        humidity: +(sumHumidity / n).toFixed(1)
                    };
                }

            } catch (wErr) {
                console.warn("Weather API failed, using fallback:", wErr.message);
            }
        }

        // ── ML Payload ───────────────────────────────────
        const farmSizeHa = Number(farm.size) * 0.404686;

        const mlPayload = {
            crop_variety,
            seed_type,
            irrigation_type,
            use_fertilizer: Boolean(use_fertilizer),

            fertilizer_n: Number(fertilizer_n) || 0,
            fertilizer_p: Number(fertilizer_p) || 0,
            fertilizer_k: Number(fertilizer_k) || 0,

            soil_n: Number(farm.n) || 50,
            soil_p: Number(farm.p) || 25,
            soil_k: Number(farm.k) || 30,
            soil_ph: Number(soil_ph) || Number(farm.ph) || 6.5,

            soil_type: "Alluvial",
            farm_size_ha: farmSizeHa,

            ...weatherData
        };

        // ── Call ML Backend ──────────────────────────────
        const mlRes = await axios.post(
            "http://127.0.0.1:5000/predict_yield",
            mlPayload,
            { timeout: 15000 }
        );

        return res.status(200).json({
            status: "success",
            ...mlRes.data,
            weatherUsed: weatherData,
            farm_size_ha: farmSizeHa
        });

    } catch (error) {
        console.error(
            "Yield Prediction Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            status: "error",
            msg: `Yield prediction failed: ${error.message}`
        });
    }
};
module.exports = { addfarm, cp: cropPrediction, uptval: updateSoilValues, gafbyid: getallfarmsbyid, gfbid: getsinglefarmbyid, dfbid: delFarmById, yp: yieldPrediction };