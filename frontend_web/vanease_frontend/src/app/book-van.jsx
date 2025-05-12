"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import api from "../utils/axiosConfig"
import "../styles/book-van.css"

export default function BookVan() {
  const navigate = useNavigate()
  const { token } = useUserContext()
  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropoffLocation: "VanEase Cebu City Office",
    startDate: "",
    endDate: "",
    totalDays: 0,
    totalPrice: 0,
    vanModel: "",
    paymentMethod: "onsite",
  })
  const [vanModels, setVanModels] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [driverLicenseImage, setDriverLicenseImage] = useState(null)
  const [driverLicensePreview, setDriverLicensePreview] = useState(null)

  useEffect(() => {
    const fetchVanModels = async () => {
      try {
        const response = await api.get("/vehicles")
        setVanModels(response.data.filter((vehicle) => vehicle.availability))
      } catch (error) {
        console.error("Error fetching van models:", error)
        setErrorMessage(error.response?.data || "Failed to load van models. Please try again later.")
      }
    }

    fetchVanModels()
  }, [token])

  const handleLicenseImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setDriverLicenseImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setDriverLicensePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (formData.startDate && formData.endDate && selectedVehicleId) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const diffTime = Math.abs(endDate - startDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const totalDays = Math.max(1, diffDays)

      const selectedVehicle = vanModels.find((vehicle) => vehicle.vehicleId === selectedVehicleId)
      if (selectedVehicle) {
        const price = selectedVehicle.rentalRate * totalDays
        setFormData((prev) => ({
          ...prev,
          totalDays: totalDays,
          totalPrice: price,
        }))
      }
    }
  }, [formData.startDate, formData.endDate, selectedVehicleId, vanModels])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "vanModel") {
      const selectedVehicle = vanModels.find((vehicle) => `${vehicle.brand} ${vehicle.model}` === value)
      setSelectedVehicleId(selectedVehicle ? selectedVehicle.vehicleId : null)
    }

    if (name === "endDate" && formData.startDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(value)
      if (endDate < startDate) {
        setErrorMessage("End date cannot be before start date")
        return
      }
      setErrorMessage("")
    }

    if (name === "startDate" && formData.endDate) {
      const startDate = new Date(value)
      const endDate = new Date(formData.endDate)
      if (endDate < startDate) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          endDate: value,
        }))
        return
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!selectedVehicleId) {
      setErrorMessage("Please select a van model.")
      return
    }

    if (!token) {
      setErrorMessage("You must be logged in to make a booking.")
      navigate("/login")
      return
    }

    try {
      const bookingRequest = {
        vehicleId: selectedVehicleId,
        startDate: formData.startDate,
        totalDays: formData.totalDays,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        totalPrice: formData.totalPrice,
        paymentMethod: formData.paymentMethod === "onsite" ? "CASH_ON_SITE" : "PAYPAL",
      }

      const response = await api.post("/bookings", bookingRequest)
      setSuccessMessage("Booking request submitted successfully!")
      setFormData({
        pickupLocation: "",
        dropoffLocation: "VanEase Cebu City Office",
        startDate: "",
        endDate: "",
        totalDays: 0,
        totalPrice: 0,
        vanModel: "",
        paymentMethod: "onsite",
      })
      setSelectedVehicleId(null)
      setDriverLicenseImage(null)
      setDriverLicensePreview(null)
      navigate("/my-bookings")
    } catch (error) {
      console.error("Error submitting booking:", error)
      if (error.response?.status === 403) {
        setErrorMessage("You don't have permission to make bookings. Please log in as a customer.")
        return
      }
      setErrorMessage(error.response?.data || "An unexpected error occurred. Please try again.")
    }
  }

  return (
    <main>
      <div className="booking-container">
        <h1 className="booking-title">Book Your Van</h1>
        <p className="booking-subtitle">
          Fill out the form below to reserve your van. We'll get back to you promptly to confirm your booking.
        </p>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="booking-card">
          <div className="booking-layout">
            <div className="booking-info">
              <h2 className="booking-info-title">Booking Information</h2>

              <div className="booking-features">
                <div className="booking-feature">
                  <span className="booking-feature-icon">📅</span>
                  <div className="booking-feature-content">
                    <h4>Flexible Rental Periods</h4>
                    <p>Daily, weekly, and monthly rental options available to suit your schedule.</p>
                  </div>
                </div>
                <div className="booking-feature">
                  <span className="booking-feature-icon">👥</span>
                  <div className="booking-feature-content">
                    <h4>Variety of Options</h4>
                    <p>Choose from our range of vans to match your specific requirements.</p>
                  </div>
                </div>
                <div className="booking-feature">
                  <span className="booking-feature-icon">📍</span>
                  <div className="booking-feature-content">
                    <h4>Multiple Locations</h4>
                    <p>Convenient pickup and drop-off points throughout the city.</p>
                  </div>
                </div>
              </div>

              <div className="booking-payment-info">
                <h4 className="booking-payment-title">Payment Options</h4>
                <div className="booking-payment-methods">
                  <div className="booking-payment-method">
                    <span className="booking-payment-icon">💵</span>
                    <div>
                      <h5>Cash On-Site</h5>
                      <p>Pay in cash when you pick up your van</p>
                    </div>
                  </div>
                  <div className="booking-payment-method">
                    <span className="booking-payment-icon">💳</span>
                    <div>
                      <h5>PayPal</h5>
                      <p>Secure online payment via PayPal</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-help">
                <h4>Need Help?</h4>
                <p>Our customer service team is available 24/7 to assist you with your booking.</p>
                <p className="booking-help-phone">Call us: (555) 123-4567</p>
              </div>
            </div>

            <div className="booking-form">
              <form onSubmit={handleSubmit} className="van-form">
                <div className="booking-form-section">
                  <h3 className="booking-form-section-title">Rental Details</h3>
                </div>

                <div className="booking-form-section">
                  <h3 className="booking-form-section-title">Rental Dates &amp; Locations</h3>
                  
                  <div className="booking-form-grid">
                    <div className="booking-form-group">
                      <label htmlFor="startDate" className="booking-form-label">
                        <span className="booking-label-icon">📅</span> Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="booking-form-control"
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="booking-form-group">
                      <label htmlFor="pickupLocation" className="booking-form-label">
                        <span className="booking-label-icon">📍</span> Pickup Location
                      </label>
                      <input
                        type="text"
                        id="pickupLocation"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        className="booking-form-control"
                        placeholder="Enter pickup location"
                        required
                      />
                    </div>
                  </div>

                  <div className="booking-form-grid">
                    <div className="booking-form-group">
                      <label htmlFor="endDate" className="booking-form-label">
                        <span className="booking-label-icon">📅</span> End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="booking-form-control"
                        min={formData.startDate || new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="booking-form-group">
                      <label htmlFor="dropoffLocation" className="booking-form-label">
                        <span className="booking-label-icon">📍</span> Drop-off Location
                      </label>
                      <input
                        type="text"
                        id="dropoffLocation"
                        name="dropoffLocation"
                        value={formData.dropoffLocation}
                        className="booking-form-control"
                        placeholder="Enter drop-off location"
                        readOnly
                      />
                      <small className="form-text">Default drop-off at VanEase Cebu City Office</small>
                    </div>
                  </div>
                </div>

                <div className="booking-form-section">
                  <h3 className="booking-form-section-title">Vehicle Selection</h3>
                  
                  <div className="booking-form-group">
                    <label htmlFor="vanModel" className="booking-form-label">
                      <span className="booking-label-icon">🚐</span> Select Your Van
                    </label>
                    <select
                      id="vanModel"
                      name="vanModel"
                      value={formData.vanModel}
                      onChange={handleChange}
                      className="booking-form-control"
                      required
                    >
                      <option value="">Choose a van model</option>
                      {vanModels.map((vehicle) => (
                        <option key={vehicle.vehicleId} value={`${vehicle.brand} ${vehicle.model}`}>
                          {vehicle.brand} {vehicle.model} - ₱{vehicle.rentalRate}/day
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedVehicleId && (
                    <div className="selected-van-details">
                      <h4 className="selected-van-title">Selected Vehicle Details</h4>
                      {vanModels.filter(v => v.vehicleId === selectedVehicleId).map(vehicle => (
                        <div key={vehicle.vehicleId} className="selected-van-info">
                          <div className="selected-van-info-item">
                            <span className="selected-van-label">Model:</span>
                            <span className="selected-van-value">{vehicle.brand} {vehicle.model}</span>
                          </div>
                          <div className="selected-van-info-item">
                            <span className="selected-van-label">Daily Rate:</span>
                            <span className="selected-van-value">₱{vehicle.rentalRate.toLocaleString()}</span>
                          </div>
                          <div className="selected-van-info-item">
                            <span className="selected-van-label">Capacity:</span>
                            <span className="selected-van-value">{vehicle.capacity || "Standard"} passengers</span>
                          </div>
                          <div className="selected-van-info-item">
                            <span className="selected-van-label">Transmission:</span>
                            <span className="selected-van-value">{vehicle.transmission || "Automatic"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                  <div className="booking-form-group">
                    <label htmlFor="driverLicense" className="booking-form-label">
                      Driver's License Image
                    </label>
                    <input
                      type="file"
                      id="driverLicense"
                      name="driverLicense"
                      onChange={handleLicenseImageChange}
                      className="booking-form-control"
                      accept="image/*"
                      required
                    />
                    {driverLicensePreview && (
                      <div className="license-preview">
                        <img
                          src={driverLicensePreview || "/placeholder.svg"}
                          alt="Driver's License Preview"
                          className="license-preview-image"
                        />
                      </div>
                    )}
                  </div>

                <div className="booking-form-section">
                  <h3 className="booking-form-section-title">Booking Summary</h3>
                  
                  <div className="booking-summary">
                    <div className="booking-summary-row">
                      <div className="booking-summary-label">
                        <span className="booking-label-icon">📆</span> Rental Duration:
                      </div>
                      <div className="booking-summary-value highlight">
                        {formData.totalDays} {formData.totalDays === 1 ? "day" : "days"}
                      </div>
                    </div>
                    
                    <div className="booking-summary-row">
                      <div className="booking-summary-label">
                        <span className="booking-label-icon">💰</span> Daily Rate:
                      </div>
                      <div className="booking-summary-value">
                        {selectedVehicleId ? 
                          `₱${vanModels.find(v => v.vehicleId === selectedVehicleId)?.rentalRate.toLocaleString()}/day` : 
                          "Select a van"}
                      </div>
                    </div>
                    
                    <div className="booking-summary-row total">
                      <div className="booking-summary-label">
                        <span className="booking-label-icon">💵</span> Total Price:
                      </div>
                      <div className="booking-summary-value highlight">
                        ₱{formData.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="booking-form-section">
                  <h3 className="booking-form-section-title">Payment Method</h3>
                  <div className="booking-form-group">
                    <div className="payment-options">
                      <label className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="onsite"
                          checked={formData.paymentMethod === "onsite"}
                          onChange={handleChange}
                        />
                        <span className="payment-option-icon">💵</span>
                        <div className="payment-option-info">
                          <span className="payment-option-title">Cash On-Site</span>
                          <span className="payment-option-description">Pay in cash when you pick up your van</span>
                        </div>
                      </label>
                      <label className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={formData.paymentMethod === "paypal"}
                          onChange={handleChange}
                        />
                        <span className="payment-option-icon">💳</span>
                        <div className="payment-option-info">
                          <span className="payment-option-title">PayPal</span>
                          <span className="payment-option-description">Secure online payment via PayPal</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="booking-form-submit">
                  Book Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
