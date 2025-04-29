"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "../styles/van-list.css"

export default function VanList() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/vehicles") // Backend API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch vehicles")
        }
        const data = await response.json()
        console.log("Fetched vehicles:", data) // Debugging log
        setVehicles(data)
      } catch (err) {
        console.error("Error fetching vehicles:", err) // Debugging log
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  if (loading) {
    return <div className="loading">Loading vehicles...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <main>
      <div className="van-list-container">
        <h1 className="van-list-title">Our Vehicle Collection</h1>
        <div className="van-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.vehicleId} className="van-card">
              <img
                src={`http://localhost:3000${vehicle.image}`} // Ensure correct image path
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="van-card-image"
                onError={(e) => {
                  e.target.src = "/placeholder.svg" // Correct fallback image path
                }}
              />
              <div className="van-card-content">
                <h3>{vehicle.brand} {vehicle.model}</h3>
                <p>Year: {vehicle.year}</p>
                <p>Rental Rate: ₱{vehicle.rentalRate}/day</p>
                <Link to="/book-van" className="btn btn-primary">
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
