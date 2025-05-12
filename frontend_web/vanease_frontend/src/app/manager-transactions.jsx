"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useUserContext } from "../context/UserContext"
import ManagerNavbar from "../components/ManagerNavbar"
import "../styles/manager-transactions.css"
import api from "../utils/axiosConfig"
import PaymentReceiptModal from "../components/PaymentReceiptModal"

const ManagerTransactions = () => {
  const navigate = useNavigate()
  const { user, token, loading: userLoading } = useUserContext()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  useEffect(() => {
    // Wait for user context to load
    if (userLoading) return

    // Check if user is a manager
    if (!token || !user || user.role !== "ROLE_MANAGER") {
      console.error("Access denied:", { token: !!token, user: !!user, role: user?.role })
      toast.error("Access denied. Please log in as a manager.")
      navigate("/manager-login")
      return
    }

    fetchTransactions()
  }, [token, user, userLoading, navigate])

  useEffect(() => {
    filterTransactions()
  }, [transactions, activeTab, searchTerm])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Ensure token is set in headers
      if (!token) {
        console.error("No authentication token available")
        throw new Error("No authentication token available")
      }

      // Log the request details for debugging
      console.log("Fetching transactions with token:", {
        token: token.substring(0, 20) + "...",
        user: user,
        role: user?.role,
      })

      const response = await api.get("/bookings")

      if (!response.data) {
        console.error("No data received from server")
        throw new Error("No data received from server")
      }

      // Transform the bookings into transactions
      const transactions = response.data
        .filter((booking) => booking?.status === "CONFIRMED" || booking?.status === "COMPLETED")
        .map((booking) => ({
          id: booking?.bookingId,
          customerName: booking?.user?.name || "Unknown Customer",
          customerEmail: booking?.user?.email || "N/A",
          vehicleName: booking?.vehicle
            ? `${booking.vehicle.brand || ""} ${booking.vehicle.model || ""}`.trim()
            : "Unknown Vehicle",
          amount: booking?.totalPrice || 0,
          paymentMethod: booking?.payment?.paymentMethod || booking?.paymentMethod || "N/A",
          transactionId: booking?.payment?.transactionId || "N/A",
          status: booking?.status || "UNKNOWN",
          startDate: booking?.startDate,
          endDate: booking?.endDate,
          payment: {
            bookingId: booking?.bookingId,
            transactionId: booking?.payment?.transactionId,
            paymentMethod: booking?.payment?.paymentMethod || booking?.paymentMethod || "N/A",
            amount: booking?.totalPrice,
            paymentDate: booking?.payment?.paymentDate || booking?.createdAt,
            customerName: booking?.user?.name,
            customerEmail: booking?.user?.email,
            vehicleName: booking?.vehicle
              ? `${booking.vehicle.brand || ""} ${booking.vehicle.model || ""}`.trim()
              : "Unknown Vehicle",
            startDate: booking?.startDate,
            endDate: booking?.endDate,
            status: booking?.payment?.status || "COMPLETED",
          },
        }))

      console.log("Successfully fetched transactions:", transactions.length)
      setTransactions(transactions)
      setFilteredTransactions(transactions)
    } catch (err) {
      console.error("Error fetching transactions:", {
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.config?.headers,
      })

      if (err.response?.status === 403) {
        setError("Access denied. Please ensure you have manager privileges.")
        toast.error("Access denied. Please ensure you have manager privileges.")
        navigate("/manager-login")
      } else {
        setError(err.response?.data || "Failed to load transactions. Please try again.")
        toast.error(err.response?.data || "Failed to load transactions. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filter by payment method
    if (activeTab !== "all") {
      filtered = filtered.filter((t) => t?.paymentMethod?.toLowerCase() === activeTab.toLowerCase())
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t?.customerName?.toLowerCase() || "").includes(searchLower) ||
          (t?.vehicleName?.toLowerCase() || "").includes(searchLower) ||
          (t?.transactionId?.toLowerCase() || "").includes(searchLower),
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleViewReceipt = (payment) => {
    if (!payment) {
      console.error("No payment data available")
      return
    }
    console.log("Opening receipt for payment:", payment)
    setSelectedPayment(payment)
    setIsReceiptModalOpen(true)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  if (userLoading) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="transactions-page">
          <div className="loading">Loading user information...</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "ROLE_MANAGER") {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="transactions-page">
          <div className="loading">Loading transactions...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="transactions-page">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="manager-page">
      <ManagerNavbar />
      <div className="transactions-page">
        <div className="transactions-header">
          <h1>Transaction History</h1>
          <div className="transactions-filters">
            <div className="filter-buttons">
              <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
                All
              </button>
              <button className={activeTab === "paypal" ? "active" : ""} onClick={() => setActiveTab("paypal")}>
                PayPal
              </button>
              <button className={activeTab === "cash" ? "active" : ""} onClick={() => setActiveTab("cash")}>
                Cash
              </button>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by customer, vehicle, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="transactions-container">
          {filteredTransactions.length === 0 ? (
            <div className="no-transactions">
              <div className="empty-state-icon">📋</div>
              <h3>No transactions found</h3>
              <p>Try adjusting your search criteria or check back later</p>
            </div>
          ) : (
            <div className="transactions-list">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-header">
                    <div className="transaction-id-section">
                      <div className="transaction-id">Booking #{transaction.id}</div>
                      <div className="transaction-date">
                        {transaction.startDate && transaction.endDate
                          ? `${new Date(transaction.startDate).toLocaleDateString()} - ${new Date(transaction.endDate).toLocaleDateString()}`
                          : "N/A"}
                      </div>
                    </div>
                    <div className={`payment-method ${transaction.paymentMethod.toLowerCase()}`}>
                      {transaction.paymentMethod === "PAYPAL"
                        ? "PayPal"
                        : transaction.paymentMethod === "CASH_ON_SITE"
                          ? "Cash On-Site"
                          : transaction.paymentMethod}
                    </div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-info-grid">
                      <div className="transaction-info-column">
                        <div className="detail-row">
                          <span className="detail-icon">👤</span>
                          <div className="detail-content">
                            <span className="detail-label">Customer:</span>
                            <span className="detail-value">{transaction.customerName}</span>
                            <span className="detail-subvalue">{transaction.customerEmail}</span>
                          </div>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">🚐</span>
                          <div className="detail-content">
                            <span className="detail-label">Vehicle:</span>
                            <span className="detail-value">{transaction.vehicleName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="transaction-info-column">
                        <div className="detail-row">
                          <span className="detail-icon">💰</span>
                          <div className="detail-content">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value amount">{formatCurrency(transaction.amount)}</span>
                          </div>
                        </div>
                        {transaction.transactionId && (
                          <div className="detail-row">
                            <span className="detail-icon">🔢</span>
                            <div className="detail-content">
                              <span className="detail-label">Transaction ID:</span>
                              <span className="detail-value transaction-id-value">{transaction.transactionId}</span>
                            </div>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-icon">📊</span>
                          <div className="detail-content">
                            <span className="detail-label">Status:</span>
                            <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="transaction-actions">
                    <button className="view-receipt-btn" onClick={() => handleViewReceipt(transaction.payment)}>
                      <span className="btn-icon">📄</span>
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPayment && (
          <PaymentReceiptModal
            payment={selectedPayment}
            isOpen={isReceiptModalOpen}
            onClose={() => {
              setIsReceiptModalOpen(false)
              setSelectedPayment(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ManagerTransactions
