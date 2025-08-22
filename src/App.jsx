import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// helper component to auto zoom map to data
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points.map(p => [p[0], p[1]]))
    }
  }, [points, map])
  return null
}

function App() {
  const [data, setData] = useState([])
  const [weatherData, setWeatherData] = useState({})
  const apiKey = "029c9b3c49b954c92966be00ef7638e3" // <-- replace with your key
  const CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache time

  // fetch balloon data via proxy
  useEffect(() => {
    async function fetchData() {
      const promises = Array.from({ length: 24 }, (_, i) => {
        const url = `https://windborne-project-1.onrender.com/api/data/${i}`
        return fetch(url).then(r => r.json()).catch(() => null)
      })
      const results = await Promise.all(promises)
      const clean = results.filter(r => r !== null)
      setData(clean)
    }
    fetchData()
  }, [])

  // only take the *latest* point from each dataset
  const latestPoints = data.map(arr => arr[arr.length - 1]).filter(Boolean)

  // fetch weather for only those latest points with caching
  useEffect(() => {
    async function loadWeather() {
      const newWeather = { ...weatherData }

      const promises = latestPoints.map(async ([lat, lon]) => {
        const key = `${lat},${lon}`

        // check localStorage for cached entry
        const cached = localStorage.getItem(`weather_${key}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            newWeather[key] = parsed.data
            return
          }
        }

        // fetch fresh if not cached or expired
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        try {
          const res = await fetch(url)
          const json = await res.json()
          newWeather[key] = json
          // save to localStorage with timestamp
          localStorage.setItem(
            `weather_${key}`,
            JSON.stringify({ data: json, timestamp: Date.now() })
          )
        } catch (err) {
          console.error("Weather fetch failed", err)
        }
      })

      await Promise.all(promises)
      setWeatherData(newWeather)
    }

    if (latestPoints.length > 0 && apiKey !== "029c9b3c49b954c92966be00ef7638e3") {
      loadWeather()
    }
  }, [latestPoints, apiKey])

  return (
    <div>
      <h1>Windborne Flight Viewer</h1>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {latestPoints.map((point, idx) => {
          const [lat, lon, alt] = point
          const key = `${lat},${lon}`
          const weather = weatherData[key]

          return (
            <Marker
              key={idx}
              position={[lat, lon]}
              icon={L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })}
            >
              <Popup>
                <strong>Altitude:</strong> {alt} km <br />
                <strong>Lat:</strong> {lat} <br />
                <strong>Lon:</strong> {lon} <br />
                {weather ? (
                  <>
                    <strong>Temp:</strong> {weather.main.temp} °C <br />
                    <strong>Wind:</strong> {weather.wind.speed} m/s at {weather.wind.deg}° <br />
                    <strong>Condition:</strong> {weather.weather[0].description}
                  </>
                ) : (
                  <em>Loading weather...</em>
                )}
              </Popup>
            </Marker>
          )
        })}

        {/* connect latest positions with red line */}
        <Polyline positions={latestPoints.map(p => [p[0], p[1]])} color="red" />

        {/* auto zoom map to fit all markers */}
        <FitBounds points={latestPoints} />
      </MapContainer>
    </div>
  )
}

export default App
