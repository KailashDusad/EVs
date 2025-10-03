document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inputForm")
  const resultDiv = document.getElementById("results")
  const getBMSDataBtn = document.getElementById("getBMSData")
  const spinner = document.getElementById("spinner")

  getBMSDataBtn.addEventListener("click", () => {
    getBMSDataBtn.disabled = true
    getBMSDataBtn.textContent = "Generating..."

    setTimeout(() => {
      getBMSDataBtn.disabled = false
      getBMSDataBtn.textContent = "Get BMS Data"
      Re_generated = (Math.random() * (0.9 - 0.01) + 0.01).toFixed(4) // Re b/w 0.01-0.05
      Rct_generated = (Math.random() * (4 - 0.1) + 0.1).toFixed(4) // Rct b/w 0.05-0.2
      temperature_generated = (Math.random() * (50 - 30) + 30).toFixed(1) // temperature b/w 15-40
      SoC_generated = Math.floor(Math.random() * (70 - 10 + 1)) + 10 // SoC b/w 20-100
      document.getElementById("Re").value = Re_generated
      document.getElementById("Rct").value = Rct_generated
      document.getElementById("temperature").value = temperature_generated
      document.getElementById("SoC").value = SoC_generated
      document.getElementById("bmsData").style.display = "block"
      document.getElementById("estimateB").style.display = "flex"
      document.getElementById("estimateB").style.justifyContent = "center"
      document.getElementById("estimateB").style.alignItems = "center"
    }, 1000)
  })
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    document.getElementById("estimateB").disabled = true
    document.getElementById("estimateB").innerHTML = `<div id="spinner" class="loader-bars">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>`
    // Show that spinner inside this button
    // spinner.style.display = 'flex';
    const messages = [
      "Training the SoH model...",
      "Estimating SoH...",
      "Estimating Range...",
      "Finding the nearest optimal charging station...",
      "Processing...",
    ]
    resultDiv.innerHTML = ""
    let msgIndex = 0
    let stopMessages = false
    const startTimeinSec = Math.floor(Date.now() / 1000)
    function showNextMessage() {
      if (stopMessages) return
      if (msgIndex < messages.length) {
        resultDiv.innerHTML = `<p>${messages[msgIndex]}</p>`
        msgIndex++
        setTimeout(showNextMessage, 2500)
      }
    }
    var TimeDiv = document.getElementById("loading")
    TimeDiv.style.display = "block"
    TimeDiv.innerHTML = ``
    const timerInterval = setInterval(() => {
      const currentTimeinSec = Math.floor(Date.now() / 1000)
      const elapsed = currentTimeinSec - startTimeinSec
      TimeDiv.innerHTML = `Elapsed time: ${elapsed}s`
    }, 1000)
    TimeDiv.style.display = "block"
    // TimeDiv.style.marginTop = "20px"
    TimeDiv.style.fontWeight = "bold"
    TimeDiv.style.color = "white"
    TimeDiv.style.fontSize = "16px"
    TimeDiv.style.textAlign = "right"
    TimeDiv.style.fontFamily = "Arial, sans-serif"
    TimeDiv.style.padding = "10px"

    showNextMessage()
    const Re = Number.parseFloat(document.getElementById("Re").value)
    const Rct = Number.parseFloat(document.getElementById("Rct").value)
    const temperature = Number.parseFloat(document.getElementById("temperature").value)
    const SoC = Number.parseFloat(document.getElementById("SoC").value)
    const startlat = Number.parseFloat(document.getElementById("startLat").value)
    const startlon = Number.parseFloat(document.getElementById("startLon").value)
    const latitude = Number.parseFloat(document.getElementById("latitude").value)
    const longitude = Number.parseFloat(document.getElementById("longitude").value)

    fetch("/estimate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Re, Rct, temperature, SoC, latitude, longitude, startlat, startlon }),
    })
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("estimateB").disabled = false
        document.getElementById("estimateB").textContent = "Run Estimation"
        clearInterval(timerInterval)
        stopMessages = true
        if (data.chargingNeeded === false) {
          resultDiv.innerHTML = `
                    <h3>Estimation Results</h3>
                    <p class="success">Estimated range is sufficient to reach the destination.</p>
                    <p class="success"><strong>Estimated State of Health (SoH):</strong> ${typeof data.soh === "number" ? data.soh.toFixed(2) : data.soh}%</p>
                    <p class="success"><strong>Model Accuracy:</strong> ${typeof data.modelAccuracy === "number" ? data.modelAccuracy.toFixed(2) + "%" : data.modelAccuracy}</p>
                    <p class="success"><strong>Matlab Execution Time:</strong> ${data.matlabExecutionTimeinsec} seconds</p>
                    <p class="success"><strong>State of Charge (SoC):</strong> ${data.soc}%</p>
                    <p class="success"><strong>Distance from Start to Destination:</strong> ${data.distStartToDest} km</p>
                    <p class="success"><strong>Estimated Range:</strong> ${data.range} km</p>
                `
          return
        }
        let rangePointStr = "N/A"
        if (data.range_point && typeof data.range_point.lat === "number" && typeof data.range_point.lon === "number") {
          rangePointStr = `Lat: ${data.range_point.lat.toFixed(6)}, Lon: ${data.range_point.lon.toFixed(6)}`
        }
        resultDiv.innerHTML = `
                <h3>Estimation Results</h3>
                <p class="success"><strong>Estimated State of Health (SoH):</strong> ${typeof data.soh === "number" ? data.soh.toFixed(2) : data.soh}%</p>
                <p class="success"><strong>Model Accuracy:</strong> ${typeof data.modelAccuracy === "number" ? data.modelAccuracy.toFixed(2) + "%" : data.modelAccuracy}</p>
                <p class="success"><strong>Matlab Execution Time:</strong> ${data.matlabExecutionTimeinsec} seconds</p>
                <p class="success"><strong>State of Charge (SoC):</strong> ${data.soc}%</p>
                <p class="success"><strong>Distance from Start to Destination:</strong> ${data.distStartToDest} km</p>
                <p class="success"><strong>Estimated Range:</strong> ${data.range} km</p>
                <p class="success"><strong>Range Point:</strong> ${rangePointStr}</p>
                <p class="${data.nearest_station === "No station found" ? "warning" : "success"}"><strong>Nearest Charging Station:</strong> ${data.nearest_station}</p>
                <p class="success"><strong>Coordinates of Nearest Station:</strong> ${data.nearest_station_coords ? `Lat: ${data.nearest_station_coords.lat}, Lon: ${data.nearest_station_coords.lon}` : "N/A"}</p>
                <p class="success"><strong>Distance to Nearest Station From start:</strong> ${data.dist_to_station_km !== null ? data.dist_to_station_km + " km" : "N/A"}</p>
                <p class="success"><strong>Distance to station from Range Point:</strong> ${data.dist_station_to_range_point_km !== null ? data.dist_station_to_range_point_km + " km" : "N/A"}</p>
            `
      })
      .catch((error) => {
        document.getElementById("estimateB").disabled = false
        document.getElementById("estimateB").textContent = "Run Estimation"
        // spinner.style.display = 'none';
        clearInterval(timerInterval)
        stopMessages = true
        console.error("Error:", error)
        resultDiv.innerHTML = "<p>An error occurred while processing your request.</p>"
      })
  })

  fetch("/data/road_data.json")
    .then((response) => response.json())
    .then((roadData) => {
      console.log("Road Ok")
    })
    .catch((error) => console.error("Error fetching road data:", error))

  fetch("/data/petrol_pump_data.json")
    .then((response) => response.json())
    .then((petrolPumpData) => {
      console.log("Petrol Pump Ok")
    })
    .catch((error) => console.error("Error fetching petrol pump data:", error))
})
