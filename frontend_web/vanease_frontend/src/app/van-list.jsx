"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import "../styles/van-list.css"

// Import placeholder image
import placeholderImage from "../assets/placeholder.svg"

export default function VanList() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { token } = useUserContext()

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/vehicles", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : ""
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch vehicles")
        }

        const data = await response.json()
        setVehicles(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching vehicles:", err)
        setError("Failed to load vehicles")
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [token])

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter((vehicle) => {
    return searchTerm === "" || `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage
    if (imagePath.startsWith("http")) return imagePath
    return `http://localhost:8080${imagePath}`
  }

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

  const vanSpecsStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "5px",
  }

  const vanSpecStyle = {
    display: "flex",
    flexDirection: "column",
  }

  const specLabelStyle = {
    color: "#6b7280",
    fontSize: "0.875rem",
    marginBottom: "0.25rem",
    fontWeight: "500",
  }

  const specValueStyle = {
    fontWeight: "500",
    color: "#333",
  }

  const availableBadgeStyle = {
    backgroundColor: "rgba(52, 168, 83, 0.9)",
  }

  const unavailableBadgeStyle = {
    backgroundColor: "rgba(234, 67, 53, 0.9)",
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
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="no-results">
            <h3>No vehicles found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="van-grid">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.vehicleId} className="van-card">
                <div className="van-card-image-container">
                  <img
                    src={getImageUrl(vehicle.image)}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="van-card-image"
                    onError={(e) => {
                      e.target.src = placeholderImage
                    }}
                  />
                  {vehicle.availability ? (
                    <span className="van-card-badge" style={availableBadgeStyle}>
                      Available
                    </span>
                  ) : (
                    <span className="van-card-badge" style={unavailableBadgeStyle}>
                      Unavailable
                    </span>
                  )}
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
                      <span className="detail-icon">💰</span>
                      <span>₱{vehicle.rentalRate}/day</span>
                    </div>
                  </div>
                  <div className="van-specs" style={vanSpecsStyle}>
                    <div className="van-spec" style={vanSpecStyle}>
                      <span className="spec-label" style={specLabelStyle}>
                        Seats:
                      </span>
                      <span className="spec-value" style={specValueStyle}>
                        {vehicle.seatingCapacity || "N/A"}
                      </span>
                    </div>
                    <div className="van-spec" style={vanSpecStyle}>
                      <span className="spec-label" style={specLabelStyle}>
                        Transmission:
                      </span>
                      <span className="spec-value" style={specValueStyle}>
                        {vehicle.transmission || "N/A"}
                      </span>
                    </div>
                    <div className="van-spec" style={vanSpecStyle}>
                      <span className="spec-label" style={specLabelStyle}>
                        Plate #:
                      </span>
                      <span className="spec-value" style={specValueStyle}>
                        {vehicle.plateNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="van-card-actions">
                    <Link
                      to={`/book-van?vehicleId=${vehicle.vehicleId}`}
                      className="btn-book"
                      state={{ selectedVehicle: vehicle }}
                    >
                      Book Now
                    </Link>
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
