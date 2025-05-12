import React, { useEffect, useState } from 'react';
import api from '../utils/axiosConfig';

// PayPal sandbox client ID
const PAYPAL_CLIENT_ID = 'AaOys3QXgr7biPbAGWTJFDkd0ClqUQm4Ny2g8DBSnh_AP-bFhf3HVOFcI35II7IDAxcWD7fZLOp2kKgv';

const PayPalButton = ({ bookingId, onSuccess, onError }) => {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isButtonRendered, setIsButtonRendered] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        // Load PayPal script only once
        if (!window.paypal) {
            const script = document.createElement('script');
            script.src = "https://www.sandbox.paypal.com/sdk/js?client-id=AaOys3QXgr7biPbAGWTJFDkd0ClqUQm4Ny2g8DBSnh_AP-bFhf3HVOFcI35II7IDAxcWD7fZLOp2kKgv&currency=PHP";
            script.async = true;
            script.onload = () => setIsScriptLoaded(true);
            script.onerror = () => setLoadError(new Error('Unable to load payment system. Please try again later.'));
            document.body.appendChild(script);
        } else {
            setIsScriptLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isScriptLoaded || !window.paypal || !bookingId) return;

        const renderButton = async () => {
            try {
                const buttons = window.paypal.Buttons({
                    createOrder: async () => {
                        try {
                            const response = await api.post('/paypal/create-order', {
                                bookingId: bookingId
                            });
                            return response.data.orderId;
                        } catch (err) {
                            onError(new Error('Unable to process payment. Please try again.'));
                            throw err;
                        }
                    },
                    onApprove: async (data) => {
                        try {
                            const response = await api.post(`/paypal/capture-order/${data.orderID}?bookingId=${bookingId}`);
                            if (response.data) {
                                onSuccess(response.data);
                            }
                        } catch (err) {
                            onError(new Error('Payment failed. Please try again.'));
                        }
                    },
                    onError: (err) => {
                        console.error('PayPal Error:', err);
                        onError(new Error('Payment failed. Please try again.'));
                    }
                });

                // Find the container
                const container = document.getElementById('paypal-button-container');
                if (!container) return;

                // Clear and render
                container.innerHTML = '';
                await buttons.render(container);
                setIsButtonRendered(true);
            } catch (err) {
                console.error('Button Render Error:', err);
                setLoadError(new Error('Unable to load payment button. Please try again.'));
            }
        };

        renderButton();
    }, [isScriptLoaded, bookingId, onSuccess, onError]);

    if (!bookingId) {
        return <div>Error: Booking ID is required</div>;
    }

    if (loadError) {
        return (
            <div>
                {loadError.message}
                <button 
                    onClick={() => {
                        setLoadError(null);
                        setIsButtonRendered(false);
                        // Force reload the page to get a fresh PayPal instance
                        window.location.reload();
                    }}
                    style={{ marginLeft: '10px', padding: '5px 10px' }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '150px', 
            position: 'relative',
            isolation: 'isolate'
        }}>
            {!isButtonRendered && (
                <div style={{ 
                    position: 'absolute', 
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                }}>
                    Loading payment options...
                </div>
            )}
            <div 
                id="paypal-button-container"
                style={{ 
                    width: '100%', 
                    minHeight: '150px',
                    position: 'relative',
                    zIndex: 2
                }}
            />
        </div>
    );
};

export default PayPalButton; 