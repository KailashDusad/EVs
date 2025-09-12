document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inputForm');
    const resultDiv = document.getElementById('results');
    const getBMSDataBtn = document.getElementById('getBMSData');
    
    getBMSDataBtn.addEventListener('click', function() {
        getBMSDataBtn.disabled = true;
        getBMSDataBtn.textContent = 'Generating...';
        setTimeout(() => {
            getBMSDataBtn.disabled = false;
            getBMSDataBtn.textContent = 'Get BMS Data';
            Re_generated = (Math.random() * (0.05 - 0.01) + 0.01).toFixed(4); // Random Re between 0.01 and 0.05
            Rct_generated = (Math.random() * (0.2 - 0.05) + 0.05).toFixed(4); // Random Rct between 0.05 and 0.2
            temperature_generated = (Math.random() * (40 - 15) + 15).toFixed(1); // Random temperature between 15 and 40
            SoC_generated = Math.floor(Math.random() * (100 - 20 + 1)) + 20; // Random SoC between 20 and 100
            document.getElementById('Re').value = Re_generated;
            document.getElementById('Rct').value = Rct_generated;
            document.getElementById('temperature').value = temperature_generated;
            document.getElementById('SoC').value = SoC_generated;
            document.getElementById('bmsData').style.display = 'block';
        }, 1000);

    });
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        resultDiv.innerHTML = '<p>Processing...</p>';
        const Re = parseFloat(document.getElementById('Re').value);
        const Rct = parseFloat(document.getElementById('Rct').value);
        const temperature = parseFloat(document.getElementById('temperature').value);
        const SoC = parseFloat(document.getElementById('SoC').value);
        const startlat = parseFloat(document.getElementById('startLat').value);
        const startlon = parseFloat(document.getElementById('startLon').value);
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);

        fetch('/estimate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Re, Rct, temperature, SoC, latitude, longitude, startlat, startlon})
        })
        .then(response => response.json())
        .then(data => {
            let rangePointStr = 'N/A';
            if (data.range_point && typeof data.range_point.lat === 'number' && typeof data.range_point.lon === 'number') {
                rangePointStr = `Lat: ${data.range_point.lat.toFixed(6)}, Lon: ${data.range_point.lon.toFixed(6)}`;
            }
            resultDiv.innerHTML = `
                <h3>Estimation Results</h3>
                <p>State of Health (SoH): ${typeof data.soh === 'number' ? data.soh.toFixed(2) : data.soh}%</p>
                <p>State of Charge (SoC): ${data.soc}%</p>
                <p>Estimated Range: ${data.range} km</p>
                <p>Range Point: ${rangePointStr}</p>
                <p>Nearest Charging Station: ${data.nearest_station}</p>
                <p>Coordinates of Nearest Station: ${data.nearest_station_coords ? `Lat: ${data.nearest_station_coords.lat}, Lon: ${data.nearest_station_coords.lon}` : 'N/A'}</p>
                <p>Distance to Nearest Station From start: ${data.dist_to_station_km !== null ? data.dist_to_station_km + ' km' : 'N/A'}</p>
                <p>Distance to station from Range Point: ${data.dist_station_to_range_point_km !== null ? data.dist_station_to_range_point_km + ' km' : 'N/A'}</p>
            `;
        })
        .catch(error => {
            console.error('Error:', error);
            resultDiv.innerHTML = '<p>An error occurred while processing your request.</p>';
        });
    });

    fetch('/data/road_data.json')
        .then(response => response.json())
        .then(roadData => {
            console.log('Road Ok');
        })
        .catch(error => console.error('Error fetching road data:', error));

    fetch('/data/petrol_pump_data.json')
        .then(response => response.json())
        .then(petrolPumpData => {
            console.log('Petrol Pump Ok');
        })
        .catch(error => console.error('Error fetching petrol pump data:', error));
});