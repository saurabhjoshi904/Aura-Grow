"use client"

import { useEffect, useRef } from "react"

interface Sensor {
  id: string
  name: string
  type: string
  location: string
  coordinates: [number, number]
  value: number
  unit: string
  status: string
  lastReading: string
}

interface SensorMapProps {
  sensors: Sensor[]
}

export function SensorMap({ sensors }: SensorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Import Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map centered on the first sensor or default location
        const centerCoords = sensors.length > 0 ? sensors[0].coordinates : [29.375055, 79.531300]

        mapInstanceRef.current = L.map(mapRef.current).setView(centerCoords, 13)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        // Add sensor markers
        sensors.forEach((sensor) => {
          const getMarkerColor = (status: string) => {
            switch (status) {
              case "low":
                return "#ef4444" // red
              case "high":
                return "#f59e0b" // amber
              default:
                return "#10b981" // green
            }
          }

          const getMarkerIcon = (type: string) => {
            switch (type) {
              case "soil_moisture":
                return "💧"
              case "temperature":
                return "🌡️"
              case "water_level":
                return "🚰"
              default:
                return "📊"
            }
          }

          // Create custom marker
          const markerHtml = `
            <div style="
              background-color: ${getMarkerColor(sensor.status)};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              ${getMarkerIcon(sensor.type)}
            </div>
          `

          const customIcon = L.divIcon({
            html: markerHtml,
            className: "custom-marker",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })

          const marker = L.marker(sensor.coordinates, { icon: customIcon }).addTo(mapInstanceRef.current)

          // Add popup with sensor information
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${sensor.name}</h3>
              <p style="margin: 4px 0;"><strong>Value:</strong> ${sensor.value}${sensor.unit}</p>
              <p style="margin: 4px 0;"><strong>Location:</strong> ${sensor.location}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> 
                <span style="
                  background-color: ${getMarkerColor(sensor.status)};
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 12px;
                ">${sensor.status}</span>
              </p>
              <p style="margin: 4px 0; color: #666;"><strong>Last reading:</strong> ${sensor.lastReading}</p>
            </div>
          `

          marker.bindPopup(popupContent)
        })

        // Fit map to show all sensors
        if (sensors.length > 1) {
          const group = new L.featureGroup(sensors.map((sensor) => L.marker(sensor.coordinates)))
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        }
      }
    }

    initMap()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [sensors])

  return (
    <div className="space-y-4">
      {/* Map Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Low/Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
          <span>High/Warning</span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-border bg-muted"
        style={{ minHeight: "400px" }}
      />

      {/* Sensor Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-semibold">{sensors.length}</div>
          <div className="text-muted-foreground">Total Sensors</div>
        </div>
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-semibold text-green-600">{sensors.filter((s) => s.status === "normal").length}</div>
          <div className="text-muted-foreground">Normal</div>
        </div>
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-semibold text-red-600">{sensors.filter((s) => s.status === "low").length}</div>
          <div className="text-muted-foreground">Low/Critical</div>
        </div>
        <div className="text-center p-2 bg-muted rounded">
          <div className="font-semibold text-amber-600">{sensors.filter((s) => s.status === "high").length}</div>
          <div className="text-muted-foreground">High/Warning</div>
        </div>
      </div>
    </div>
  )
}
























































































































































