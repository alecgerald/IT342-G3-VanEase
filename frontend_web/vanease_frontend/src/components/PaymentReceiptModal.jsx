import React from 'react';
import '../styles/payment-receipt.css';

const PaymentReceiptModal = ({ isOpen, onClose, payment }) => {
    if (!isOpen || !payment) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    return (
        <div className="receipt-modal-overlay" onClick={onClose}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Payment Receipt</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
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
                            <div className="receipt-section">
                                <h3>Booking Information</h3>
                                <div className="receipt-row">
                                    <span className="receipt-label">Booking ID:</span>
                                    <span className="receipt-value">#{payment.bookingId}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Vehicle:</span>
                                    <span className="receipt-value">{payment.vehicleName}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Booking Period:</span>
                                    <span className="receipt-value">
                                        {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Status:</span>
                                    <span className="receipt-value">{payment.status}</span>
                                </div>
                            </div>

                            <div className="receipt-section">
                                <h3>Payment Information</h3>
                                <div className="receipt-row">
                                    <span className="receipt-label">Payment Method:</span>
                                    <span className="receipt-value">{payment.paymentMethod}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Transaction ID:</span>
                                    <span className="receipt-value">{payment.transactionId}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Payment Date:</span>
                                    <span className="receipt-value">{formatDate(payment.paymentDate)}</span>
                                </div>
                                <div className="receipt-row total">
                                    <span className="receipt-label">Total Amount:</span>
                                    <span className="receipt-value">{formatCurrency(payment.amount)}</span>
                                </div>
                            </div>

                            <div className="receipt-section">
                                <h3>Customer Information</h3>
                                <div className="receipt-row">
                                    <span className="receipt-label">Name:</span>
                                    <span className="receipt-value">{payment.customerName}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Email:</span>
                                    <span className="receipt-value">{payment.customerEmail}</span>
                                </div>
                            </div>
                        </div>

                        <div className="receipt-footer">
                            <p>Thank you for choosing VanEase!</p>
                            <p className="receipt-note">This receipt serves as proof of payment.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceiptModal; 