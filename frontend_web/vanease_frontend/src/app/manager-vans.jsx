"use client"

import { useState, useRef, useEffect } from "react"
import ManagerNavbar from "../components/ManagerNavbar"
import "../styles/manager-vans.css"
import placeholderImage from "../assets/placeholder.svg"
import { useUserContext } from "../context/UserContext"

export default function ManagerVans() {
  const [vehicles, setVehicles] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    rentalRate: "",
    plateNumber: "",
    availability: true,
    seatingCapacity: "",
    transmission: "Automatic",
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState({ text: "", type: "" })
  const { token } = useUserContext()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch vehicles" }))
        throw new Error(errorData.message || "Failed to fetch vehicles")
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected an array of vehicles")
      }
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setMessage({ text: error.message || "Failed to load vehicles", type: "error" })
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage
    if (imagePath.startsWith("http")) return imagePath
    return `http://localhost:8080/api/vehicles/images/${imagePath}`
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number.parseInt(value, 10) || "" : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      rentalRate: "",
      plateNumber: "",
      availability: true,
      seatingCapacity: "",
      transmission: "Automatic",
    })
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setEditingVehicle(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Validate required fields
      if (!formData.brand || !formData.model || !formData.year || !formData.rentalRate || 
          !formData.plateNumber || formData.availability === undefined || !formData.seatingCapacity || 
          !formData.transmission) {
        throw new Error("All fields are required")
      }

      // Convert and validate data types
      const year = parseInt(formData.year)
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        throw new Error("Invalid year")
      }

      const rentalRate = parseFloat(formData.rentalRate)
      if (isNaN(rentalRate) || rentalRate <= 0) {
        throw new Error("Invalid rental rate")
      }

      const seatingCapacity = parseInt(formData.seatingCapacity)
      if (isNaN(seatingCapacity) || seatingCapacity <= 0) {
        throw new Error("Invalid seating capacity")
      }

      const formDataToSend = new FormData()
      
      // Add each field with proper type conversion
      formDataToSend.append('brand', formData.brand.trim())
      formDataToSend.append('model', formData.model.trim())
      formDataToSend.append('year', year.toString())
      formDataToSend.append('rentalRate', rentalRate.toString())
      formDataToSend.append('plateNumber', formData.plateNumber.trim())
      formDataToSend.append('availability', formData.availability.toString())
      formDataToSend.append('seatingCapacity', seatingCapacity.toString())
      formDataToSend.append('transmission', formData.transmission.trim())

      // Add the image if it exists
      if (imageFile) {
        formDataToSend.append("image", imageFile)
      }

      const url = editingVehicle
        ? `http://localhost:8080/api/vehicles/${editingVehicle.vehicleId}`
        : "http://localhost:8080/api/vehicles"
      const method = editingVehicle ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to save vehicle" }))
        throw new Error(errorData.message || "Failed to save vehicle")
      }

      const updatedVehicle = await response.json()
      if (!updatedVehicle) {
        throw new Error("Invalid response format: expected vehicle data")
      }

      setMessage({
        text: `Vehicle ${editingVehicle ? "updated" : "added"} successfully!`,
        type: "success",
      })
      resetForm()
      setShowAddForm(false)
      fetchVehicles()
    } catch (error) {
      console.error("Error saving vehicle:", error)
      setMessage({
        text: error.message || `Failed to ${editingVehicle ? "update" : "add"} vehicle`,
        type: "error",
      })
    }

    setTimeout(() => {
      setMessage({ text: "", type: "" })
    }, 3000)
  }

  const handleEdit = (vehicle) => {
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      rentalRate: vehicle.rentalRate,
      plateNumber: vehicle.plateNumber,
      availability: vehicle.availability,
      seatingCapacity: vehicle.seatingCapacity,
      transmission: vehicle.transmission,
    })
    setImagePreview(getImageUrl(vehicle.imagePath))
    setEditingVehicle(vehicle)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (vehicleId) => {
    if (!vehicleId) return
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/vehicles/${vehicleId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to delete vehicle" }))
          throw new Error(errorData.message || "Failed to delete vehicle")
        }

        setMessage({ text: "Vehicle deleted successfully!", type: "success" })
        fetchVehicles()
      } catch (error) {
        console.error("Error deleting vehicle:", error)
        setMessage({ text: error.message || "Failed to delete vehicle", type: "error" })
      }

      setTimeout(() => {
        setMessage({ text: "", type: "" })
      }, 3000)
    }
  }

  const toggleAvailability = async (vehicleId) => {
    if (!vehicleId) return
    try {
      const vehicle = vehicles.find((v) => v?.vehicleId === vehicleId)
      if (!vehicle) {
        throw new Error("Vehicle not found")
      }

      const response = await fetch(`http://localhost:8080/api/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...vehicle,
          availability: !vehicle.availability,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update vehicle availability" }))
        throw new Error(errorData.message || "Failed to update vehicle availability")
      }

      const updatedVehicle = await response.json()
      if (!updatedVehicle) {
        throw new Error("Invalid response format: expected vehicle data")
      }

      setMessage({
        text: `Vehicle marked as ${!vehicle.availability ? "available" : "unavailable"}!`,
        type: "success",
      })
      fetchVehicles()
    } catch (error) {
      console.error("Error updating vehicle availability:", error)
      setMessage({ text: error.message || "Failed to update vehicle availability", type: "error" })
    }

    setTimeout(() => {
      setMessage({ text: "", type: "" })
    }, 3000)
  }

  return (
    <>
      <ManagerNavbar />
      <div className="manager-vans-container">
        <div className="manager-vans-header">
          <h1>Van Management</h1>
          <p>Add, edit, and manage the van fleet</p>
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <div className="van-actions">
          <button
            className="btn btn-primary create-van-btn"
            onClick={() => {
              resetForm()
              setShowAddForm(!showAddForm)
            }}
          >
            {showAddForm ? "Cancel" : "Create New Van"}
          </button>
        </div>

        {showAddForm && (
          <div className="van-form-section">
            <h2>{editingVehicle ? "Edit Van" : "Add New Van"}</h2>
            <form onSubmit={handleSubmit} className="van-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="model">Model</label>
                  <input type="text" id="model" name="model" value={formData.model} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="plateNumber">Plate Number</label>
                  <input
                    type="text"
                    id="plateNumber"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rentalRate">Rental Rate (₱/day)</label>
                  <input
                    type="number"
                    id="rentalRate"
                    name="rentalRate"
                    value={formData.rentalRate}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="seatingCapacity">Seating Capacity</label>
                  <input
                    type="number"
                    id="seatingCapacity"
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transmission">Transmission</label>
                  <select
                    id="transmission"
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    required
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="availability" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="availability"
                      name="availability"
                      checked={formData.availability}
                      onChange={handleChange}
                    />
                    <span>Available</span>
                  </label>
                </div>
              </div>

              <div className="form-group image-upload-group">
                <label htmlFor="image">Van Image</label>
                <input type="file" id="image" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Van preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingVehicle ? "Update Van" : "Add Van"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm()
                    setShowAddForm(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="van-list-section">
          <h2>Van Fleet</h2>

          {vehicles.length === 0 ? (
            <div className="empty-state">
              <p>No vehicles found. Add a new van to get started.</p>
            </div>
          ) : (
            <div className="van-cards">
              {vehicles.map((vehicle) => (
                <div key={vehicle.vehicleId} className="van-card">
                  <div className="van-card-header">
                    <h3 className="van-card-title">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <span className={`availability-badge ${vehicle.availability ? "available" : "unavailable"}`}>
                      {vehicle.availability ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="van-card-image">
                    <img
                      src={getImageUrl(vehicle.imagePath)}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      onError={(e) => {
                        e.target.src = placeholderImage
                      }}
                    />
                  </div>

                  <div className="van-card-details">
                    <div className="detail-item">
                      <span className="detail-label">Plate Number:</span>
                      <span className="detail-value">{vehicle.plateNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Year:</span>
                      <span className="detail-value">{vehicle.year}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Rental Rate:</span>
                      <span className="detail-value">₱{vehicle.rentalRate}/day</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Seating Capacity:</span>
                      <span className="detail-value">{vehicle.seatingCapacity} persons</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Transmission:</span>
                      <span className="detail-value">{vehicle.transmission}</span>
                    </div>
                  </div>

                  <div className="van-card-actions">
                    <button className="btn btn-secondary" onClick={() => toggleAvailability(vehicle.vehicleId)}>
                      Mark as {vehicle.availability ? "Unavailable" : "Available"}
                    </button>
                    <button className="btn btn-edit" onClick={() => handleEdit(vehicle)}>
                      Edit
                    </button>
                    <button className="btn btn-delete" onClick={() => handleDelete(vehicle.vehicleId)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}