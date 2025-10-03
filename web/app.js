const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// const fetch = require('node-fetch');


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use('/data', express.static(path.join(__dirname, 'data')));

const roadData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'road_data.json')));
const petrolPumpData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'petrol_pump_data.json')));

async function haversine(lat1, lon1, lat2, lon2) {
    const apiKey = process.env.ORS_API_KEY; 
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${lon1},${lat1}&end=${lon2},${lat2}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.features && data.features[0]) {
        return data.features[0].properties.summary.distance / 1000; 
    }
    throw new Error('No route found');
}

function pointAtDistance(lat1, lon1, lat2, lon2, d) {
    const R = 6371; 
    const toRad = x => x * Math.PI / 180;
    const toDeg = x => x * 180 / Math.PI;

    const φ1 = toRad(lat1), λ1 = toRad(lon1);
    const φ2 = toRad(lat2), λ2 = toRad(lon2);

    const θ = Math.atan2(
        Math.sin(λ2 - λ1) * Math.cos(φ2),
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
    );

    const δ = d / R; 

    const φ3 = Math.asin(Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ3 = λ1 + Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ3)
    );

    return { lat: toDeg(φ3), lon: toDeg(λ3) };
}

app.post('/estimate', async (req, res) => {
    const { Re, Rct, temperature, SoC, latitude,  longitude, startlat, startlon} = req.body;
    const outputFile = path.join(__dirname, 'data', 'matlab_output.json');
    
    const matlabScriptPath = path.join(__dirname, 'train_and_estimate.m').replace(/\\/g, '/');
    const outputFileMatlab = outputFile.replace(/\\/g, '/');
    // const chargingNeeded = true; 
    const matlabCmd = `matlab -batch "addpath('${path.dirname(matlabScriptPath)}'); train_and_estimate(${Re},${Rct},${temperature},'${outputFileMatlab}'); exit;"`;
    const startTime = Date.now();
    exec(matlabCmd, async (error, stdout, stderr) => {
        const endTime = Date.now();
        const matlabDurationMs = endTime - startTime;
        if (error) {
            console.error('MATLAB error:', stderr);
            return res.status(500).json({ error: 'MATLAB execution failed', details: stderr });
        }
        fs.readFile(outputFile, 'utf8', async (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to read MATLAB output' });
            }
            let result;
            try {
                result = JSON.parse(data);
            } catch (e) {
                return res.status(500).json({ error: 'Invalid MATLAB output' });
            }
            const estimatedRange = calculateRange((result.soh)/100, SoC/100);
            
            // 1st we will calculate the disteance between start and destination
            // and see if the range is sufficient
            // If not sufficient, then we will do further calculations otherwise we will return that we need not charging this is sufficient
            // const distStartToDest = haversine(startlat, startlon, latitude, longitude);
            let distStartToDest = null;
            try {
                distStartToDest = await haversine(startlat, startlon, latitude, longitude);
            } catch (e) {
                console.error('Error fetching road distance:', e);
            }
            if (estimatedRange >= distStartToDest) {
                return res.status(200).json({
                    chargingNeeded: false,
                    soh: result.soh,
                    soc: SoC,
                    range: estimatedRange,
                    range_point: { lat: latitude, lon: longitude },
                    nearest_station: 'No station needed',
                    nearest_station_coords: null,
                    dist_to_station_km: 0,
                    dist_station_to_range_point_km: 0,
                    distStartToDest: Math.round(distStartToDest * 100) / 100,
                    modelAccuracy: result.model_R2 ? (Math.round(result.model_R2 * 10000) / 100) : 'N/A',
                    matlabExecutionTimeinsec: (matlabDurationMs / 1000).toFixed(2) 
                });
            }


            // Find nearest charging station
            // let nearestStation = 'No station found';
            // let minDist = Infinity;
            // let nearestCoords = null;

            // if (
            //     petrolPumpData.elements &&
            //     petrolPumpData.elements.length > 0 &&
            //     typeof latitude === 'number' &&
            //     typeof longitude === 'number'
            // ) {
            //     petrolPumpData.elements.forEach(station => {
            //         if (station.lat && station.lon) {
            //             const dist = haversine(latitude, longitude, station.lat, station.lon);
            //             if (dist < minDist) {
            //                 minDist = dist;
            //                 nearestStation = station.tags && station.tags.name ? station.tags.name : 'Unnamed Station';
            //                 nearestCoords = { lat: station.lat, lon: station.lon };
            //             }
            //         }
            //     });
            // }

            // res.status(200).json({
            //     soh: result.soh,
            //     soc: SoC,
            //     range: estimatedRange,
            //     nearest_station: nearestStation,
            //     nearest_station_coords: nearestCoords,
            //     dist_to_station_km: minDist === Infinity ? null : Math.round(minDist * 100) / 100
            // });
            let rangePoint = null;
            if (
                typeof startlat === 'number' && typeof startlon === 'number' &&
                typeof latitude === 'number' && typeof longitude === 'number'
            ) {
                rangePoint = pointAtDistance(startlat, startlon, latitude, longitude, estimatedRange);
            }

            let candidates = [];
            if (
                petrolPumpData.elements &&
                petrolPumpData.elements.length > 0 &&
                typeof startlat === 'number' &&
                typeof startlon === 'number'
            ) {
                for (const station of petrolPumpData.elements) {
                    if (station.lat && station.lon) {
                        let distFromStart = null;
                        try {
                            distFromStart = await haversine(startlat, startlon, station.lat, station.lon);
                        } catch (e) {
                            console.error('Error fetching road distance:', e);
                        }
                        if (distFromStart !== null && distFromStart <= estimatedRange) {
                            candidates.push({
                                ...station,
                                distFromStart
                            });
                        }
                    }
                }
            }

            let nearestStation = 'No station found';
            let nearestCoords = null;
            let minDistToRangePoint = Infinity;
            let distToStationFromStart = null;

            if (rangePoint && candidates.length > 0) {
                for (const station of candidates) {
                    let distToRange = null;
                    try {
                        distToRange = await haversine(rangePoint.lat, rangePoint.lon, station.lat, station.lon);
                    } catch (e) {
                        console.error('Error fetching road distance:', e);
                    }
                    if (distToRange !== null && distToRange < minDistToRangePoint) {
                        minDistToRangePoint = distToRange;
                        nearestStation = station.tags && station.tags.name ? station.tags.name : 'Unnamed Station';
                        nearestCoords = { lat: station.lat, lon: station.lon };
                        distToStationFromStart = station.distFromStart;
                    }
                }
            }

            res.status(200).json({
                chargingNeeded: true,
                soh: result.soh,
                soc: SoC,
                range: estimatedRange,
                range_point: rangePoint,
                nearest_station: nearestStation,
                nearest_station_coords: nearestCoords,
                dist_to_station_km: distToStationFromStart === null ? null : Math.round(distToStationFromStart * 100) / 100,
                dist_station_to_range_point_km: minDistToRangePoint === Infinity ? null : Math.round(minDistToRangePoint * 100) / 100,
                distStartToDest: Math.round(distStartToDest * 100) / 100,
                modelAccuracy: result.model_R2 ? (Math.round(result.model_R2 * 10000) / 100) : 'N/A',
                matlabExecutionTimeinsec: (matlabDurationMs / 1000).toFixed(2)
            });
        });
    });
});

// async function haversine(lat1, lon1, lat2, lon2) {
//     function toRad(x) { return x * Math.PI / 180; }
//     const R = 6371; 
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
// }

function calculateRange(SoH, SoC) {
    const C_nom_Ah = 75;          // Nominal capacity in Ah (≈26 kWh pack)
    const V_nom_V = 350;          // Nominal voltage in V
    const eta_drivetrain = 0.9;   // Drivetrain + inverter efficiency
    const SoC_min = 0.10;         // Minimum usable SOC (10%)
    const e_cons_Wh_per_km = 180; // Average consumption in Wh/km (urban + highway mix in India)
    const P_aux_kW = 1.5;         // Auxiliaries (AC, lights, etc.)
    const v_kmh = 40;             // Avg. city driving speed (km/h)
    const f_regen = 0.15;         // Regen recovery fraction (≈15%)
    
    const usable_frac = Math.max(0, SoC - SoC_min); 
    const E_usable_Wh = C_nom_Ah * V_nom_V * SoH * usable_frac; 
    const E_deliverable_Wh = E_usable_Wh * eta_drivetrain;

    // Aux consumption per km (Wh/km)
    const e_aux_Wh_per_km = (P_aux_kW * 1000) / v_kmh;

    // Effective consumption with regen
    const e_cons_eff = e_cons_Wh_per_km * (1 - f_regen);

    // Final range in km
    const denom = e_cons_eff + e_aux_Wh_per_km;
    const R_km = (denom > 0) ? (E_deliverable_Wh / denom) : 0;

    return Math.round(R_km);
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});