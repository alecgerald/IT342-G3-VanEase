"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import ManagerNavbar from "../components/ManagerNavbar"
import api from "../utils/axiosConfig"
import { toast } from "react-toastify"
import "../styles/manager-dashboard.css"

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const { token, user, loading: userLoading } = useUserContext()
  const [stats, setStats] = useState({
    totalVans: 0,
    activeBookings: 0,
    pendingBookings: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Wait for user context to load
    if (userLoading) return

    // Check if user is a manager
    if (!token || !user || user.role !== 'ROLE_MANAGER') {
      console.error('Access denied:', { token: !!token, user: !!user, role: user?.role })
      toast.error('Access denied. Please log in as a manager.')
      navigate('/manager-login')
      return
    }

    fetchDashboardData()
  }, [token, user, userLoading, navigate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all required data in parallel
      const [vehiclesResponse, bookingsResponse] = await Promise.all([
        api.get('/vehicles'),
        api.get('/bookings')
      ])

      const vehicles = vehiclesResponse.data
      const bookings = bookingsResponse.data

      // Calculate statistics
      const totalVans = vehicles.length
      const activeBookings = bookings.filter(booking => 
        booking.status === 'ACTIVE' || booking.status === 'CONFIRMED'
      ).length
      const pendingBookings = bookings.filter(booking => 
        booking.status === 'PENDING'
      ).length
      const revenue = bookings
        .filter(booking => booking.payment?.status === 'COMPLETED')
        .reduce((total, booking) => total + (booking.totalPrice || 0), 0)

      setStats({
        totalVans,
        activeBookings,
        pendingBookings,
        revenue: new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP'
        }).format(revenue)
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data || 'Failed to load dashboard data')
      toast.error(err.response?.data || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="manager-dashboard-container">
          <div className="loading">Loading user information...</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ROLE_MANAGER') {
    return null // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="manager-dashboard-container">
          <div className="loading">Loading dashboard data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manager-page">
        <ManagerNavbar />
        <div className="manager-dashboard-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ManagerNavbar />
      <div className="manager-dashboard-container">
        <div className="manager-dashboard-header">
          <h1>Manager Dashboard</h1>
          <p>Welcome to the Rental management portal</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🚐</div>
            <div className="stat-content">
              <h3>Total Vans</h3>
              <p className="stat-value">{stats.totalVans}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Active Bookings</h3>
              <p className="stat-value">{stats.activeBookings}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Bookings</h3>
              <p className="stat-value">{stats.pendingBookings}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Revenue</h3>
              <p className="stat-value">{stats.revenue}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <div className="action-card">
            <h3>Manage Vans</h3>
            <p>Add, edit, or remove vans from your fleet</p>
            <Link to="/manager-vans" className="action-button">
              Go to Van Management
            </Link>
          </div>
          <div className="action-card">
            <h3>Manage Bookings</h3>
            <p>View and process customer booking requests</p>
            <Link to="/manager-bookings" className="action-button">
              Go to Booking Management
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
