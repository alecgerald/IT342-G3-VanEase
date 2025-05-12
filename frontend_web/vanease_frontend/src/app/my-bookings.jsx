"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import api from "../utils/axiosConfig"
import "../styles/my-bookings.css"
import PayPalButton from "../components/PayPalButton"
import PaymentReceiptModal from "../components/PaymentReceiptModal"
import { toast } from "react-toastify"
import placeholderImage from "../assets/placeholder.svg"

export default function MyBookings() {
  const navigate = useNavigate()
  const { token } = useUserContext()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const getImageUrl = (imagePath) => {
    if (!imagePath) return placeholderImage
    if (imagePath.startsWith("http")) return imagePath
    return `https://it342-g3-vanease.onrender.com${imagePath}`
  }

  const fetchBookings = async () => {
    try {
      if (!token) {
        navigate("/login")
        return
      }

      const response = await api.get("/bookings/user")
      // Transform the data to include vehicle details and calculate totals
      const transformedBookings = response.data.map((booking) => {
        // Calculate total days from start and end dates
        const startDate = new Date(booking.startDate)
        const endDate = new Date(booking.endDate)
        const diffTime = Math.abs(endDate - startDate)
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Get the total price from payment or calculate it
        const totalPrice = booking.payment?.amount || 
          (booking.vehicle?.rentalRate * totalDays) || 
          booking.totalPrice || 0

        return {
          ...booking,
          vehicleName: booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : "Unknown Vehicle",
          vehicleImage: booking.vehicle?.image || null,
          price: booking.vehicle?.rentalRate || 0,
          totalDays: totalDays,
          totalPrice: totalPrice,
          paymentMethod: booking.payment?.paymentMethod || "N/A",
          paymentStatus: booking.payment?.status || "N/A",
          paymentDate: booking.payment?.paymentDate || null,
          transactionId: booking.payment?.transactionId || null
        }
      })
      setAllBookings(transformedBookings)
      setBookings(transformedBookings)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError(err.response?.data || "Failed to load bookings")
      setLoading(false)
    }
  }

  useEffect(() => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "#10b981" // green
      case "PENDING":
        return "#f59e0b" // amber
      case "COMPLETED":
        return "#3b82f6" // blue
      case "CANCELLED":
        return "#ef4444" // red
      default:
        return "#6b7280" // gray
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "✓"
      case "PENDING":
        return "⏳"
      case "COMPLETED":
        return "✓"
      case "CANCELLED":
        return "✕"
      default:
        return "•"
    }
  }

  const handlePaypalSuccess = (data) => {
    // Clear any existing error messages
    setPaymentError(null);
    // Refresh the bookings list to show updated payment status
    fetchBookings();
    // Show success message
    toast.success("Payment completed successfully!");
  }

  const handlePaypalError = (error) => {
    console.error("PayPal payment error:", error);
    const errorMessage = error.message || error.response?.data || "Payment failed. Please try again.";
    setPaymentError(errorMessage);
    toast.error(errorMessage);
  }

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setIsReceiptModalOpen(true)
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`)
      // Update the local state to reflect the cancellation
      const updatedBookings = allBookings.map((booking) =>
        booking.bookingId === bookingId ? { ...booking, status: "CANCELLED" } : booking,
      )

      setAllBookings(updatedBookings)
      setBookings(
        activeTab === "all" ? updatedBookings : updatedBookings.filter((booking) => booking.status === activeTab),
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
                <div className="booking-header" style={{ borderLeft: `4px solid ${getStatusColor(booking.status)}` }}>
                  <div className="booking-title">
                    <div className="booking-id-section">
                      <h2>Booking #{booking.bookingId}</h2>
                    </div>
                    <div className="booking-status" style={{ backgroundColor: `${getStatusColor(booking.status)}15` }}>
                      <span className="status-icon">{getStatusIcon(booking.status)}</span>
                      <span className="status-text">{booking.status}</span>
                    </div>
                  </div>
                </div>

                <div className="booking-content">
                  <div className="booking-vehicle-section">
                    <div className="vehicle-image-container">
                      <img
                        src={getImageUrl(booking.vehicleImage) || "/placeholder.svg"}
                        alt={booking.vehicleName}
                        className="vehicle-image"
                        onError={(e) => {
                          console.error("Image load error:", booking.vehicleImage)
                          e.target.src = placeholderImage
                        }}
                      />
                    </div>
                    <div className="vehicle-info">
                      <h3 className="vehicle-name">{booking.vehicleName}</h3>
                      <div className="vehicle-details">
                        <div className="vehicle-detail-item">
                          <span className="detail-label">Daily Rate:</span>
                          <span className="detail-value">₱{booking.price.toLocaleString()}</span>
                        </div>
                        <div className="vehicle-detail-item">
                          <span className="detail-label">Total Days:</span>
                          <span className="detail-value">{booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'}</span>
                        </div>
                        <div className="vehicle-detail-item">
                          <span className="detail-label">Total Amount:</span>
                          <span className="detail-value highlight">₱{booking.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="booking-details-grid">
                    <div className="booking-details-row">
                      <div className="booking-date-range">
                        <div className="date-icon">📅</div>
                        <div className="date-info">
                          <span className="date-label">Rental Period</span>
                          <span className="date-value">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-details-row">
                      <div className="booking-location-range">
                        <div className="location-icon">📍</div>
                        <div className="location-info">
                          <span className="location-label">Locations</span>
                          <span className="location-value">
                            {booking.pickupLocation} → {booking.dropoffLocation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {booking.payment && (
                    <div className="payment-section">
                      <h4>Payment Information</h4>
                      <div className="payment-info">
                        <div className="payment-info-item">
                          <span className="payment-label">Payment Method:</span>
                          <span className="payment-value">{booking.payment.paymentMethod}</span>
                        </div>
                        <div className="payment-info-item">
                          <span className="payment-label">Payment Status:</span>
                          <span className="payment-value" style={{ color: getStatusColor(booking.payment.paymentStatus) }}>
                            {booking.payment.paymentStatus}
                          </span>
                        </div>
                        {booking.payment.transactionId && (
                          <div className="payment-info-item">
                            <span className="payment-label">Transaction ID:</span>
                            <span className="payment-value">{booking.payment.transactionId}</span>
                          </div>
                        )}
                        {booking.payment.paymentDate && (
                          <div className="payment-info-item">
                            <span className="payment-label">Payment Date:</span>
                            <span className="payment-value">{formatDate(booking.payment.paymentDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="booking-actions">
                  {booking.status === "PENDING" && !booking.payment && (
                    <>
                      {paymentError && (
                        <div className="payment-error-message">
                          {paymentError}
                        </div>
                      )}
                      <div className="paypal-section">
                        <PayPalButton
                          key={`paypal-${booking.bookingId}`}
                          bookingId={booking.bookingId}
                          onSuccess={handlePaypalSuccess}
                          onError={handlePaypalError}
                        />
                      </div>
                    </>
                  )}
                  {booking.payment && booking.payment.paymentStatus === "COMPLETED" && (
                    <button className="view-payment-btn" onClick={() => handleViewPayment(booking.payment)}>
                      View Payment Receipt
                    </button>
                  )}
                  {booking.status === "PENDING" && !booking.payment && (
                    <button className="cancel-booking-btn" onClick={() => handleCancelBooking(booking.bookingId)}>
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false)
          setSelectedPayment(null)
        }}
        payment={selectedPayment}
      />
    </main>
  )
}
