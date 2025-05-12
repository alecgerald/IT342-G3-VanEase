import { createContext, useContext, useState, useEffect } from "react"
import api from "../utils/axiosConfig"
import { jwtDecode } from "jwt-decode"

const UserContext = createContext()

export function UserProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.request.eject(interceptor)
    }
  }, [token])

  useEffect(() => {
    const initializeUser = async () => {
      if (token) {
        try {
          // Decode the token to get user info
          const decodedToken = jwtDecode(token)
          const userInfo = {
            email: decodedToken.sub,
            role: decodedToken.role
          }
          setUser(userInfo)
          
          // Set the token in axios default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          console.error("Error decoding token:", error)
          // If token is invalid, clear it
          setToken("")
          setUser(null)
          localStorage.removeItem("token")
          delete api.defaults.headers.common['Authorization']
        }
      } else {
        setUser(null)
        delete api.defaults.headers.common['Authorization']
      }
      setLoading(false)
    }

    initializeUser()
  }, [token])

  const login = (newToken) => {
    if (!newToken) {
      console.error("No token provided to login function")
      return
    }
    setToken(newToken)
    localStorage.setItem("token", newToken)
    // Set the token in axios default headers immediately
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken("")
    setUser(null)
    localStorage.removeItem("token")
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <UserContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}
