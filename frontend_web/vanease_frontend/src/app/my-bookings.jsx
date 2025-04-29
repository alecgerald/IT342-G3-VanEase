"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../styles/my-bookings.css"

export default function MyBookings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setErrorMessage("You must be logged in to view bookings.")
          navigate("/login")
          return
        }

        const response = await fetch("http://localhost:8080/api/bookings/user", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setErrorMessage("Unauthorized access. Please log in again.")
            localStorage.removeItem("token")
            navigate("/login")
          } else {
            const errorText = await response.text()
            throw new Error(errorText || "Failed to fetch bookings")
          }
          return
        }

        const data = await response.json()
        setAllBookings(data)
        setBookings(data)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        setErrorMessage("Failed to load bookings. Please check your connection and try again.")
      }
    }

    fetchBookings()
  }, [navigate])

  const filterBookings = (tab) => {
    setActiveTab(tab)
    if (tab === "all") {
      setBookings(allBookings)
    } else {
      setBookings(allBookings.filter((booking) => booking.status === tab))
    }
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="booking-status booking-status-confirmed">
            <span className="booking-status-icon">✓</span> Confirmed
          </span>
        )
      case "pending":
        return (
          <span className="booking-status booking-status-pending">
            <span className="booking-status-icon">⏳</span> Pending
          </span>
        )
      case "completed":
        return (
          <span className="booking-status booking-status-completed">
            <span className="booking-status-icon">✓</span> Completed
          </span>
        )
      case "cancelled":
        return (
          <span className="booking-status booking-status-cancelled">
            <span className="booking-status-icon">✕</span> Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <main>
      <div className="my-bookings-container">
        <div className="my-bookings-header">
          <h1 className="my-bookings-title">My Bookings</h1>
          <p className="my-bookings-subtitle">View and manage your van rentals</p>
        </div>

        <div className="booking-tabs">
          <button
            className={`booking-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => filterBookings("all")}
          >
            All Bookings
          </button>
          <button
            className={`booking-tab ${activeTab === "confirmed" ? "active" : ""}`}
            onClick={() => filterBookings("confirmed")}
          >
            Confirmed
          </button>
          <button
            className={`booking-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => filterBookings("pending")}
          >
            Pending
          </button>
          <button
            className={`booking-tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => filterBookings("completed")}
          >
            Completed
          </button>
          <button
            className={`booking-tab ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => filterBookings("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {bookings.length === 0 ? (
          <div className="empty-bookings">
            <p className="empty-bookings-text">No {activeTab !== "all" ? activeTab : ""} bookings found.</p>
            <Link to="/van-list" className="btn btn-primary">
              Book a Van Now
            </Link>
          </div>
        ) : (
          <div>
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="booking-card">
                <div className="booking-card-layout">
                  <div className="booking-card-content">
                    <div className="booking-card-header">
                      <div>
                        <h2 className="booking-card-title">
                          Vehicle ID: {booking.vehicleId} {/* Display vehicleId */}
                        </h2>
                        <p className="booking-card-id">Booking ID: {booking.bookingId}</p>
                      </div>
                      <div>{getStatusBadge(booking.status)}</div>
                    </div>

                    <div className="booking-details">
                      <div className="booking-detail">
                        <span className="booking-detail-icon">📅</span>
                        <div className="booking-detail-content">
                          <p>Pickup Date</p>
                          <p>{formatDate(booking.startDate)}</p>
                        </div>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-icon">📅</span>
                        <div className="booking-detail-content">
                          <p>Drop-off Date</p>
                          <p>{formatDate(booking.endDate)}</p>
                        </div>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-icon">📍</span>
                        <div className="booking-detail-content">
                          <p>Pickup Location</p>
                          <p>{booking.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-icon">📍</span>
                        <div className="booking-detail-content">
                          <p>Drop-off Location</p>
                          <p>{booking.dropoffLocation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="booking-specs">
                      <div className="booking-spec">
                        <span className="booking-spec-label">Total Price:</span>
                        <span>${booking.price}</span>
                      </div>
                    </div>

                    <div className="booking-card-footer">
                      {booking.status === "pending" && <button className="btn btn-cancel">Cancel</button>}
                      {booking.status === "completed" && <button className="btn btn-review">Leave Review</button>}
                    </div>
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
