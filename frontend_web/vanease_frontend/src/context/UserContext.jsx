import { createContext, useContext, useState } from "react"

const UserContext = createContext()

export function UserProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "")

  return (
    <UserContext.Provider value={{ token, setToken }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  return useContext(UserContext)
}
