"use client"

import { useState } from "react"
import ManagerNavbar from "../components/ManagerNavbar"
import "../styles/manager-transactions.css"

export default function ManagerTransactions() {
  // Mock data for transactions
  const initialTransactions = [
    {
      id: "T001",
      bookingId: "B002",
      customerName: "Sarah Johnson",
      amount: 35000,
      paymentMethod: "PayPal",
      transactionId: "PAY-1AB23456CD789012EF34GHIJ",
      status: "completed",
      date: "2023-08-02T15:30:00Z",
    },
    {
      id: "T002",
      bookingId: "B004",
      customerName: "Emily Davis",
      amount: 13000,
      paymentMethod: "PayPal",
      transactionId: "PAY-5KL67890MN123456OP78QRST",
      status: "pending",
      date: "2023-08-05T16:45:00Z",
    },
    {
      id: "T003",
      bookingId: "B005",
      customerName: "David Wilson",
      amount: 17500,
      paymentMethod: "PayPal",
      transactionId: "PAY-9UV12345WX678901YZ23ABCD",
      status: "refunded",
      date: "2023-08-04T10:15:00Z",
    },
  ]

  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Filter transactions based on active tab
  const filteredTransactions =
    activeTab === "all" ? transactions : transactions.filter((transaction) => transaction.status === activeTab)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction)
    setIsReceiptModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsReceiptModalOpen(false)
  }

  return (
    <>
      <ManagerNavbar />
      <div className="manager-transactions-container">
        <div className="manager-transactions-header">
          <h1>Transaction History</h1>
          <p>View and manage payment transactions</p>
        </div>

        <div className="transaction-tabs">
          <button
            className={`transaction-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All Transactions
          </button>
          <button
            className={`transaction-tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => handleTabChange("completed")}
          >
            Completed
          </button>
          <button
            className={`transaction-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => handleTabChange("pending")}
          >
            Pending
          </button>
          <button
            className={`transaction-tab ${activeTab === "refunded" ? "active" : ""}`}
            onClick={() => handleTabChange("refunded")}
          >
            Refunded
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab !== "all" ? activeTab : ""} transactions found.</p>
          </div>
        ) : (
          <div className="transaction-table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{transaction.bookingId}</td>
                    <td>{transaction.customerName}</td>
                    <td>₱{transaction.amount.toLocaleString()}</td>
                    <td>{transaction.paymentMethod}</td>
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-view" onClick={() => handleViewReceipt(transaction)}>
                          View Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isReceiptModalOpen && selectedTransaction && (
          <div className="receipt-modal-overlay" onClick={handleCloseModal}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Payment Receipt</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <div className="receipt">
                  <div className="receipt-header">
                    <div className="receipt-logo">
                      <span>VanEase</span>
                    </div>
                    <div className="receipt-title">Payment Receipt</div>
                  </div>

                  <div className="receipt-details">
                    <div className="receipt-row">
                      <span className="receipt-label">Transaction ID:</span>
                      <span className="receipt-value">{selectedTransaction.id}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">PayPal Transaction ID:</span>
                      <span className="receipt-value">{selectedTransaction.transactionId}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Booking ID:</span>
                      <span className="receipt-value">{selectedTransaction.bookingId}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Customer:</span>
                      <span className="receipt-value">{selectedTransaction.customerName}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Payment Method:</span>
                      <span className="receipt-value">{selectedTransaction.paymentMethod}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Date:</span>
                      <span className="receipt-value">{formatDate(selectedTransaction.date)}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Status:</span>
                      <span className={`receipt-value status-${selectedTransaction.status}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="receipt-amount">
                    <div className="receipt-row">
                      <span className="receipt-label">Amount:</span>
                      <span className="receipt-value amount">₱{selectedTransaction.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p>VanEase - Premium Van Rental Service</p>
                    <p>123 Rental Street, Cebu City, Philippines</p>
                    <p>Email: support@vanease.com | Phone: (555) 123-4567</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  Print Receipt
                </button>
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
