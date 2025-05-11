"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUserContext } from "../context/UserContext"
import "../styles/manager-navbar.css"

export default function ManagerNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [manager, setManager] = useState({
    name: "Admin Manager",
    email: "admin@vanease.com",
  })
  const navigate = useNavigate()
  const { token, setToken } = useUserContext()

  useEffect(() => {
    // If no token is present, redirect to login
    if (!token) {
      navigate("/manager-login")
      return
    }

    // Decode token to get manager info
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      setManager({
        name: tokenPayload.name || "Manager",
        email: tokenPayload.sub || "manager@example.com"
      })
    } catch (error) {
      console.error("Error decoding token:", error)
      handleLogout()
    }
  }, [token, navigate])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = () => {
    // Clear token from both context and localStorage
    setToken("")
    localStorage.removeItem("token")
    navigate("/manager-login")
  }

  return (
    <nav className="manager-navbar">
      <div className="manager-navbar-container">
        <div className="manager-navbar-logo-section">
          <Link to="/manager-dashboard" className="manager-navbar-logo">
            <span className="logo-text">VanEase</span>
          </Link>
          <div className="manager-badge">Manager Portal</div>
        </div>

        <div className="manager-navbar-toggle" onClick={toggleMenu} aria-label="Toggle navigation menu">
          <span className="toggle-icon">{isMenuOpen ? "✕" : "☰"}</span>
        </div>

        <div className={`manager-navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <div className="manager-navbar-links">
            <Link to="/manager-dashboard" className="manager-navbar-link">
              Dashboard
            </Link>
            <Link to="/manager-vans" className="manager-navbar-link">
              Manage Vans
            </Link>
            <Link to="/manager-bookings" className="manager-navbar-link">
              Manage Bookings
            </Link>
            <Link to="/manager-transactions" className="manager-navbar-link">
              Transactions
            </Link>
          </div>

          <div className="manager-navbar-auth">
            {manager && (
              <div className="manager-profile-section">
                <div className="manager-profile">
                  <div className="manager-avatar">{manager.name ? manager.name.charAt(0) : "M"}</div>
                  <div className="manager-info">
                    <span className="manager-name">{manager.name || "Manager"}</span>
                    <span className="manager-email">{manager.email || "manager@example.com"}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="manager-logout-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
