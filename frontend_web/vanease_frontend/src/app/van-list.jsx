"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/van-list.css"

export default function VanList() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/vehicles") // Keep the original API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch vehicles")
        }
        const data = await response.json()
        console.log("Fetched vehicles:", data) // Keep debugging log
        setVehicles(data)
      } catch (err) {
        console.error("Error fetching vehicles:", err) // Keep debugging log
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  // Filter vehicles based on search term and selected type
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === "" || `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      selectedType === "all" ||
      (selectedType === "luxury" && vehicle.rentalRate >= 5000) ||
      (selectedType === "standard" && vehicle.rentalRate < 5000 && vehicle.rentalRate >= 3000) ||
      (selectedType === "economy" && vehicle.rentalRate < 3000)

    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading vehicles...</p>
      </div>
    )
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>
  }

  return (
    <main>
      <div className="van-list-container">
        <div className="van-list-header">
          <div>
            <h1 className="van-list-title">Our Vehicle Collection</h1>
            <p className="van-list-subtitle">Choose from our premium selection of vans for your next journey</p>
          </div>
        </div>

        <div className="van-list-controls">
          <div className="van-search">
            <input
              type="text"
              placeholder="Search by brand or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="van-search-input"
            />
            <span className="van-search-icon">🔍</span>
          </div>

          <div className="van-filters">
            <div className="filter-buttons">
              <button
                className={`filter-button ${selectedType === "all" ? "active" : ""}`}
                onClick={() => setSelectedType("all")}
              >
                All Vans
              </button>
              <button
                className={`filter-button ${selectedType === "luxury" ? "active" : ""}`}
                onClick={() => setSelectedType("luxury")}
              >
                Luxury
              </button>
              <button
                className={`filter-button ${selectedType === "standard" ? "active" : ""}`}
                onClick={() => setSelectedType("standard")}
              >
                Standard
              </button>
              <button
                className={`filter-button ${selectedType === "economy" ? "active" : ""}`}
                onClick={() => setSelectedType("economy")}
              >
                Economy
              </button>
            </div>
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="no-results">
            <h3>No vehicles found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="van-grid">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.vehicleId} className="van-card">
                <div className="van-card-image-container">
                  <img
                    src={
                      vehicle.image ? `http://localhost:3000${vehicle.image}` : "/placeholder.svg?height=300&width=500"
                    }
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="van-card-image"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=300&width=500"
                    }}
                  />
                  {vehicle.available && <span className="van-card-badge">Available</span>}
                </div>
                <div className="van-card-content">
                  <h3 className="van-card-title">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <div className="van-card-details">
                    <div className="van-card-detail">
                      <span className="detail-icon">📅</span>
                      <span>{vehicle.year}</span>
                    </div>
                    <div className="van-card-detail">
                      <span className="detail-icon">🔢</span>
                      <span>{vehicle.plateNumber || "N/A"}</span>
                    </div>
                  </div>
                  <div className="van-card-price">
                    <span className="price-amount">₱{vehicle.rentalRate}</span>
                    <span className="price-period">/day</span>
                  </div>
                  <div className="van-card-actions">
                    <Link
                      to={`/book-van?vehicleId=${vehicle.vehicleId}`}
                      className="btn-book"
                      state={{ selectedVehicle: vehicle }}
                    >
                      Book Now
                    </Link>
                    <button className="btn-details">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
