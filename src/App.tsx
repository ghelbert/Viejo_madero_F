import { useState } from 'react'
import type { User } from './api'
import { Login } from './features/auth/Login'
import { Waiter } from './features/waiter/Waiter'
import { Kitchen } from './features/kitchen/Kitchen'
import { Admin } from './features/admin/Admin'

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('restaurant-user')
    return stored ? JSON.parse(stored) : null
  })

  const logout = () => {
    localStorage.removeItem('restaurant-user')
    setUser(null)
  }

  const login = (nextUser: User) => {
    localStorage.setItem('restaurant-user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  if (!user) return <Login onLogin={login} />
  if (user.role === 'MOZO') return <Waiter user={user} onLogout={logout} />
  if (user.role === 'COCINERO') return <Kitchen user={user} onLogout={logout} />
  return <Admin user={user} onLogout={logout} />
}

export default App