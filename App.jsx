import React, { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App(){
  const [user, setUser] = useState(null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-primeblue">
      {!user ? (
        <Login onAuth={(u)=>setUser(u)} />
      ) : (
        <Dashboard user={user} onSignOut={()=>setUser(null)} />
      )}
    </div>
  )
}
