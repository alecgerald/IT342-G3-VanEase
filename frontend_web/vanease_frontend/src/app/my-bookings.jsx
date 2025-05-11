"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import "../styles/my-bookings.css"

export default function MyBookings() {
  const navigate = useNavigate()
  const { token } = useUserContext()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!token) {
          navigate("/login")
          return
        }

        const response = await fetch("http://localhost:8080/api/bookings/user", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch bookings")
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
  }, [token, navigate])

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
      case "CONFIRMED":
        return <span className="status-badge confirmed">✓ Confirmed</span>
      case "PENDING":
        return <span className="status-badge pending">⏳ Pending</span>
      case "COMPLETED":
        return <span className="status-badge completed">✓ Completed</span>
      case "CANCELLED":
        return <span className="status-badge cancelled">✕ Cancelled</span>
      default:
        return null
    }
  }

  const handlePayWithPaypal = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/payments/paypal/${bookingId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to initiate PayPal payment")
      }

      const data = await response.json()
      // Redirect to PayPal checkout URL
      window.location.href = data.approvalUrl
    } catch (error) {
      console.error("Error initiating PayPal payment:", error)
      setErrorMessage("Failed to initiate payment. Please try again.")
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to cancel booking")
      }

      // Update the local state to reflect the cancellation
      const updatedBookings = allBookings.map((booking) =>
        booking.bookingId === bookingId ? { ...booking, status: "CANCELLED" } : booking
      )

      setAllBookings(updatedBookings)
      setBookings(
        activeTab === "all" ? updatedBookings : updatedBookings.filter((booking) => booking.status === activeTab)
      )

      setSuccessMessage("Booking has been cancelled successfully.")
    } catch (error) {
      console.error("Error cancelling booking:", error)
      setErrorMessage("Failed to cancel booking. Please try again.")
    }

    // Clear success message after a delay
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  return (
    <main className="bookings-page">
      <div className="bookings-container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <p>View and manage your van rentals</p>
        </div>

        <div className="bookings-tabs">
          <button className={`tab-button ${activeTab === "all" ? "active" : ""}`} onClick={() => filterBookings("all")}>
            All Bookings
          </button>
          <button
            className={`tab-button ${activeTab === "CONFIRMED" ? "active" : ""}`}
            onClick={() => filterBookings("CONFIRMED")}
          >
            Confirmed
          </button>
          <button
            className={`tab-button ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => filterBookings("PENDING")}
          >
            Pending
          </button>
          <button
            className={`tab-button ${activeTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => filterBookings("COMPLETED")}
          >
            Completed
          </button>
          <button
            className={`tab-button ${activeTab === "CANCELLED" ? "active" : ""}`}
            onClick={() => filterBookings("CANCELLED")}
          >
            Cancelled
          </button>
        </div>

        {errorMessage && <div className="alert error">{errorMessage}</div>}
        {successMessage && <div className="alert success">{successMessage}</div>}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab !== "all" ? activeTab.toLowerCase() : ""} bookings found.</p>
            <Link to="/van-list" className="primary-button">
              Book a Van Now
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="booking-card">
                <div className="booking-header">
                  <div className="booking-title">
                    <h2>Booking #{booking.bookingId}</h2>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="booking-id">Vehicle ID: {booking.vehicleId}</div>
                </div>

                <div className="booking-details">
                  <div className="booking-dates">
                    <div className="booking-date">
                      <div className="date-icon">📅</div>
                      <div className="date-info">
                        <span className="date-label">Start Date</span>
                        <span className="date-value">{formatDate(booking.startDate)}</span>
                      </div>
                    </div>
                    <div className="booking-date">
                      <div className="date-icon">📅</div>
                      <div className="date-info">
                        <span className="date-label">End Date</span>
                        <span className="date-value">{formatDate(booking.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-locations">
                    <div className="booking-location">
                      <div className="location-icon">📍</div>
                      <div className="location-info">
                        <span className="location-label">Pickup Location</span>
                        <span className="location-value">{booking.pickupLocation}</span>
                      </div>
                    </div>
                    <div className="booking-location">
                      <div className="location-icon">📍</div>
                      <div className="location-info">
                        <span className="location-label">Dropoff Location</span>
                        <span className="location-value">{booking.dropoffLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-price">
                    <div className="price-icon">💰</div>
                    <div className="price-info">
                      <span className="price-label">Total Price</span>
                      <span className="price-value">₱{booking.price}</span>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  {booking.status === "PENDING" && (
                    <>
                      <button
                        className="action-button pay"
                        onClick={() => handlePayWithPaypal(booking.bookingId)}
                      >
                        Pay with PayPal
                      </button>
                      <button
                        className="action-button cancel"
                        onClick={() => handleCancelBooking(booking.bookingId)}
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <button
                      className="action-button cancel"
                      onClick={() => handleCancelBooking(booking.bookingId)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
