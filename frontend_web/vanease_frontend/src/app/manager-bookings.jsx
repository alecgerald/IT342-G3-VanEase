"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import ManagerNavbar from "../components/ManagerNavbar"
import "../styles/manager-bookings.css"

export default function ManagerBookings() {
  const navigate = useNavigate()
  const { token } = useUserContext()
  const [bookings, setBookings] = useState([])
  const [activeTab, setActiveTab] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!token) {
          navigate("/manager-login")
          return
        }

        const response = await fetch("http://localhost:8080/api/bookings", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch bookings")
        }

        const data = await response.json()
        setBookings(data)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        setMessage({ text: "Failed to load bookings", type: "error" })
      }
    }

    fetchBookings()
  }, [token, navigate])

  // Filter bookings based on active tab
  const filteredBookings = activeTab === "all" ? bookings : bookings.filter((booking) => booking.status === activeTab)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleAcceptBooking = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to confirm booking")
      }

      const updatedBooking = await response.json()
      setBookings(bookings.map(booking => 
        booking.bookingId === bookingId ? updatedBooking : booking
      ))

      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking(updatedBooking)
      }

      setMessage({ text: `Booking ${bookingId} has been confirmed.`, type: "success" })
    } catch (error) {
      console.error("Error confirming booking:", error)
      setMessage({ text: "Failed to confirm booking", type: "error" })
    }

    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const handleRejectBooking = async (bookingId) => {
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

      const updatedBooking = await response.json()
      setBookings(bookings.map(booking => 
        booking.bookingId === bookingId ? updatedBooking : booking
      ))

      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking(updatedBooking)
      }

      setMessage({ text: `Booking ${bookingId} has been cancelled.`, type: "error" })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      setMessage({ text: "Failed to cancel booking", type: "error" })
    }

    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const handleCompleteBooking = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to complete booking")
      }

      const updatedBooking = await response.json()
      setBookings(bookings.map(booking => 
        booking.bookingId === bookingId ? updatedBooking : booking
      ))

      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking(updatedBooking)
      }

      setMessage({ text: `Booking ${bookingId} has been marked as completed.`, type: "success" })
    } catch (error) {
      console.error("Error completing booking:", error)
      setMessage({ text: "Failed to complete booking", type: "error" })
    }

    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  return (
    <>
      <ManagerNavbar />
      <div className="manager-bookings-container">
        <div className="manager-bookings-header">
          <h1>Booking Management</h1>
          <p>View and manage customer bookings</p>
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <div className="booking-tabs">
          <button
            className={`booking-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All Bookings
          </button>
          <button
            className={`booking-tab ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => handleTabChange("PENDING")}
          >
            Pending
          </button>
          <button
            className={`booking-tab ${activeTab === "CONFIRMED" ? "active" : ""}`}
            onClick={() => handleTabChange("CONFIRMED")}
          >
            Confirmed
          </button>
          <button
            className={`booking-tab ${activeTab === "COMPLETED" ? "active" : ""}`}
            onClick={() => handleTabChange("COMPLETED")}
          >
            Completed
          </button>
          <button
            className={`booking-tab ${activeTab === "CANCELLED" ? "active" : ""}`}
            onClick={() => handleTabChange("CANCELLED")}
          >
            Cancelled
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab !== "all" ? activeTab.toLowerCase() : ""} bookings found.</p>
          </div>
        ) : (
          <div className="booking-table-container">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td>{booking.bookingId}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{booking.userName}</span>
                        <span className="customer-email">{booking.userEmail}</span>
                        <span className="customer-phone">{booking.userPhone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-info">
                        <span className="vehicle-model">
                          {booking.brand} {booking.model}
                        </span>
                        <span className="vehicle-plate">{booking.plateNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <span className="date-label">From:</span>
                        <span className="date-value">{formatDate(booking.startDate)}</span>
                        <span className="date-label">To:</span>
                        <span className="date-value">{formatDate(booking.endDate)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="payment-info">
                        <span className="payment-amount">₱{booking.price}</span>
                        <span className={`payment-status ${booking.paymentStatus.toLowerCase()}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-view"
                          onClick={() => handleViewBooking(booking)}
                        >
                          View
                        </button>
                        {booking.status === "PENDING" && (
                          <>
                            <button
                              className="btn btn-confirm"
                              onClick={() => handleAcceptBooking(booking.bookingId)}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-reject"
                              onClick={() => handleRejectBooking(booking.bookingId)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <button
                            className="btn btn-complete"
                            onClick={() => handleCompleteBooking(booking.bookingId)}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && selectedBooking && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Booking Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="booking-details">
                  <div className="detail-section">
                    <h3>Customer Information</h3>
                    <p>
                      <strong>Name:</strong> {selectedBooking.userName}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedBooking.userEmail}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedBooking.userPhone}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Vehicle Information</h3>
                    <p>
                      <strong>Model:</strong> {selectedBooking.brand} {selectedBooking.model}
                    </p>
                    <p>
                      <strong>Plate Number:</strong> {selectedBooking.plateNumber}
                    </p>
                    <p>
                      <strong>Year:</strong> {selectedBooking.year}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Booking Information</h3>
                    <p>
                      <strong>Start Date:</strong> {formatDate(selectedBooking.startDate)}
                    </p>
                    <p>
                      <strong>End Date:</strong> {formatDate(selectedBooking.endDate)}
                    </p>
                    <p>
                      <strong>Total Days:</strong> {selectedBooking.totalDays}
                    </p>
                    <p>
                      <strong>Total Price:</strong> ₱{selectedBooking.price}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status-badge ${selectedBooking.status.toLowerCase()}`}>
                        {selectedBooking.status}
                      </span>
                    </p>
                    <p>
                      <strong>Payment Method:</strong>{" "}
                      {selectedBooking.paymentMethod === "onsite" ? "Pay at Office" : "PayPal"}
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      <span className={`payment-status ${selectedBooking.paymentStatus.toLowerCase()}`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Location Information</h3>
                    <p>
                      <strong>Pickup Location:</strong> {selectedBooking.pickupLocation}
                    </p>
                    <p>
                      <strong>Dropoff Location:</strong> {selectedBooking.dropoffLocation}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedBooking.status === "PENDING" && (
                  <>
                    <button
                      className="btn btn-confirm"
                      onClick={() => handleAcceptBooking(selectedBooking.bookingId)}
                    >
                      Accept Booking
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleRejectBooking(selectedBooking.bookingId)}
                    >
                      Reject Booking
                    </button>
                  </>
                )}
                {selectedBooking.status === "CONFIRMED" && (
                  <button
                    className="btn btn-complete"
                    onClick={() => handleCompleteBooking(selectedBooking.bookingId)}
                  >
                    Mark as Completed
                  </button>
                )}
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
