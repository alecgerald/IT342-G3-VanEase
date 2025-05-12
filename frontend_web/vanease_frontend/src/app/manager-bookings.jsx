"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import ManagerNavbar from "../components/ManagerNavbar"
import api from "../utils/axiosConfig"
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

        const response = await api.get("/bookings")
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid response format: expected an array of bookings")
        }

        // Transform the data to match the UI
        const transformedData = response.data.map(booking => {
          const user = booking.user || {}
          const vehicle = booking.vehicle || {}
          const payment = booking.payment || {}
          return {
            bookingId: booking.bookingId || booking.booking_id || booking.id,
            userName: user.name || 'Unknown',
            userEmail: user.email || 'Unknown',
            vehicleModel: vehicle.model || 'Unknown',
            startDate: booking.startDate || booking.start_date,
            endDate: booking.endDate || booking.end_date,
            status: (booking.status || 'UNKNOWN').toLowerCase(),
            totalPrice: booking.totalPrice || booking.total_price || payment.amount || 0,
            pickupLocation: booking.pickupLocation || booking.pickup_location || 'N/A',
            dropoffLocation: booking.dropoffLocation || booking.dropoff_location || 'N/A',
            paymentMethod: payment.payment_method || 'onsite',
            paymentStatus: payment.payment_status || 'pending',
          }
        })

        setBookings(transformedData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        setMessage({ text: error.response?.data || "Failed to load bookings", type: "error" })
      }
    }

    fetchBookings()
  }, [token, navigate])

  // Filter bookings based on active tab
  const filteredBookings = activeTab === "all" ? bookings : bookings.filter((booking) => booking.status === activeTab)

  const handleTabChange = (tab) => setActiveTab(tab)
  const handleViewBooking = (booking) => { setSelectedBooking(booking); setIsModalOpen(true) }
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedBooking(null) }
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  const formatCurrency = (amount) => `₱${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const handleAcceptBooking = async (bookingId) => {
    if (!bookingId) return
    try {
      await api.post(`/bookings/${bookingId}/confirm`)
      setBookings(bookings.map(booking => booking.bookingId === bookingId ? { ...booking, status: "confirmed" } : booking))
      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "confirmed" })
      }
      setMessage({ text: `Booking ${bookingId} has been confirmed.`, type: "success" })
      handleCloseModal()
    } catch (error) {
      console.error("Error confirming booking:", error)
      setMessage({ text: error.response?.data || "Failed to confirm booking", type: "error" })
    }
    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const handleRejectBooking = async (bookingId) => {
    if (!bookingId) return
    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      setBookings(bookings.map(booking => booking.bookingId === bookingId ? { ...booking, status: "cancelled" } : booking))
      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "cancelled" })
      }
      setMessage({ text: `Booking ${bookingId} has been cancelled.`, type: "error" })
      handleCloseModal()
    } catch (error) {
      console.error("Error cancelling booking:", error)
      setMessage({ text: error.response?.data || "Failed to cancel booking", type: "error" })
    }
    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const handleCompleteBooking = async (bookingId) => {
    if (!bookingId) return
    try {
      await api.post(`/bookings/${bookingId}/complete`)
      setBookings(bookings.map(booking => booking.bookingId === bookingId ? { ...booking, status: "completed" } : booking))
      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: "completed" })
      }
      setMessage({ text: `Booking ${bookingId} has been marked as completed.`, type: "success" })
      handleCloseModal()
    } catch (error) {
      console.error("Error completing booking:", error)
      setMessage({ text: error.response?.data || "Failed to complete booking", type: "error" })
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
            className={`booking-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => handleTabChange("pending")}
          >
            Pending
          </button>
          <button
            className={`booking-tab ${activeTab === "confirmed" ? "active" : ""}`}
            onClick={() => handleTabChange("confirmed")}
          >
            Confirmed
          </button>
          <button
            className={`booking-tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => handleTabChange("completed")}
          >
            Completed
          </button>
          <button
            className={`booking-tab ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => handleTabChange("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab !== "all" ? activeTab : ""} bookings found.</p>
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
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-info">
                        <span className="vehicle-name">
                          {booking.vehicleModel}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="booking-dates">
                        <span>{formatDate(booking.startDate)}</span>
                        <span className="date-separator">to</span>
                        <span>{formatDate(booking.endDate)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="payment-badge onsite">Onsite</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-view"
                          onClick={() => handleViewBooking(booking)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && selectedBooking && (
          <div className="booking-modal-overlay" onClick={handleCloseModal}>
            <div className="booking-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Booking Details</h2>
                <button className="close-button" onClick={handleCloseModal}>✕</button>
              </div>
              <div className="modal-content">
                <div className="booking-status-bar">
                  <div className="booking-id">Booking #{selectedBooking.bookingId}</div>
                  <div className="booking-status">
                    <span className={`status-badge ${selectedBooking.status}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="booking-sections">
                  <div className="booking-section">
                    <h3>Customer Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Name</span>
                        <span className="info-value">{selectedBooking.userName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{selectedBooking.userEmail}</span>
                      </div>
                    </div>
                  </div>
                  <div className="booking-section">
                    <h3>Booking Details</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Pickup Date</span>
                        <span className="info-value">{formatDate(selectedBooking.startDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Dropoff Date</span>
                        <span className="info-value">{formatDate(selectedBooking.endDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Pickup Location</span>
                        <span className="info-value">{selectedBooking.pickupLocation}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Dropoff Location</span>
                        <span className="info-value">{selectedBooking.dropoffLocation}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Total Price</span>
                        <span className="info-value">{formatCurrency(selectedBooking.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedBooking.status === "pending" && (
                  <div className="modal-actions">
                    <button
                      className="btn btn-approve"
                      onClick={() => handleAcceptBooking(selectedBooking.bookingId)}
                    >
                      Accept Booking
                    </button>
                    <button
                      className="btn btn-cancel"
                      onClick={() => handleRejectBooking(selectedBooking.bookingId)}
                    >
                      Reject Booking
                    </button>
                  </div>
                )}
                {(selectedBooking.status && selectedBooking.status.toLowerCase() === "confirmed") && (
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
