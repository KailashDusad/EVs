// filepath: ev-battery-navigation/ev-battery-navigation/src/web/static/main.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inputForm');
    const resultDiv = document.getElementById('results');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const Re = parseFloat(document.getElementById('Re').value);
        const Rct = parseFloat(document.getElementById('Rct').value);
        const temperature = parseFloat(document.getElementById('temperature').value);
        const SoC = parseFloat(document.getElementById('SoC').value);
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);

        fetch('/estimate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Re, Rct, temperature, SoC, latitude, longitude})
        })
        .then(response => response.json())
        .then(data => {
            resultDiv.innerHTML = `
                <h3>Estimation Results</h3>
                <p>State of Health (SoH): ${data.soh}</p>
                <p>State of Charge (SoC): ${data.soc}</p>
                <p>Estimated Range: ${data.range} km</p>
                <p>Nearest Charging Station: ${data.nearest_station}</p>
                <p>Coordinates of Nearest Station: ${data.nearest_station_coords ? `Lat: ${data.nearest_station_coords.lat}, Lon: ${data.nearest_station_coords.lon}` : 'N/A'}</p>
                <p>Distance to Nearest Station: ${data.dist_to_station_km !== null ? data.dist_to_station_km + ' km' : 'N/A'}</p>
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