"use client"

import { useState, useRef } from "react"
import ManagerNavbar from "../components/ManagerNavbar"
import "../styles/manager-vans.css"

export default function ManagerVans() {
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    rentalRate: "",
    plateNumber: "",
    available: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      alert("You must be logged in to perform this action.")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("vehicle", new Blob([JSON.stringify(formData)], { type: "application/json" }))
    if (imageFile) {
      formDataToSend.append("image", imageFile)
    }

    try {
      const response = await fetch("http://localhost:8080/api/vehicles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to add vehicle")
      }

      alert("Vehicle added successfully!")
      setFormData({
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        rentalRate: "",
        plateNumber: "",
        available: true,
      })
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error adding vehicle:", error)
      alert(error.message || "An error occurred. Please try again.")
    }
  }

  return (
    <>
      <ManagerNavbar />
      <div className="manager-vans-container">
        <div className="manager-vans-header">
          <h1>Van Management</h1>
          <p>Add, edit, and manage the van fleet</p>
        </div>

        <div className="van-form-section">
          <h2>Add New Van</h2>
          <form onSubmit={handleSubmit} className="van-form">
            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
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
              <label htmlFor="rentalRate">Daily Rental Rate (₱)</label>
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
              <label htmlFor="plateNumber">License Plate</label>
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
              <label htmlFor="available">Available</label>
              <input
                type="checkbox"
                id="available"
                name="available"
                checked={formData.available}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="image">Van Image</label>
              <input
                type="file"
                id="image"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Van
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
