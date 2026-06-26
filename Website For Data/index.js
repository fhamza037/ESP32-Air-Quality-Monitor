let sensorData = null;

const params = new URLSearchParams(window.location.search);
const userLocation = params.get("location");


updateData().then(() => {
    if (userLocation) {
        analyzeLocation(userLocation);
    }
});

setInterval(updateData, 1000);

async function updateData() {
    try {
        const response = await fetch("WEB_SERVER");

        sensorData = await response.json();

        document.getElementById("temperature").textContent =
            sensorData.temperature.toFixed(1);

        document.getElementById("humidity").textContent =
            sensorData.humidity.toFixed(1);

        document.getElementById("lastUpdated").textContent =
            new Date().toLocaleTimeString();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Update immediately
updateData();

// Update every 2 seconds
setInterval(updateData, 2000);

async function getWeather(location) {

    const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
    );

    const geoData = await geoResponse.json();
    if (!geoData || !geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
    }

    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;

    // Request current weather where available
    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,temperature_2m&timezone=auto`
    );

    const weatherData = await weatherResponse.json();

    // Try to derive sensible current values from responses
    let temperature = null;
    let humidity = null;

    if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
        temperature = weatherData.current_weather.temperature;
    }

    if (weatherData.hourly && weatherData.hourly.relativehumidity_2m && weatherData.hourly.time) {
        // pick the last hourly value as an approximation
        const lastIdx = weatherData.hourly.relativehumidity_2m.length - 1;
        humidity = weatherData.hourly.relativehumidity_2m[lastIdx];
    }

    return {
        temperature: temperature,
        humidity: humidity,
    };
}

async function analyzeLocation(location) {

    if(!sensorData){
        document.getElementById("analysis").textContent = "Waiting for sensor data...";
        return;
    }

    const weatherData = await getWeather(location);

    const API_KEY = "YOUR_API_KEY";

    const prompt = `
Indoor Conditions:
Temperature: ${sensorData.temperature}°C
Humidity: ${sensorData.humidity}%

Outdoor Conditions in ${location}:
Temperature: ${weatherData.temperature}°C
Humidity: ${weatherData.humidity}%

Determine:
1. Whether conditions are safe.
2. Potential health risks.
3. Recommendations.

Keep the response under 100 words.
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        }
    );

    const data = await response.json();
    console.log("Gemini:", data);

    console.log(data);

    if(!data.candidates){
        document.getElementById("analysis").textContent = "No analysis available.";
        return;
    }

    document.getElementById("analysis").textContent =
        data.candidates[0].content.parts[0].text;

}
