import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock } from 'lucide-react'
import mockApi from '../services/mockApi'

export default function Login({ onAuth }){
  const [empId, setEmpId] = useState('')
  const [profile, setProfile] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(()=>{
    let t = null
    if (empId.length >= 6){
      t = setTimeout(async ()=>{
        const p = await mockApi.getProfileByEmployeeId(empId)
        setProfile(p)
      }, 200)
    } else setProfile(null)
    return ()=> clearTimeout(t)
  },[empId])

  function appendDigit(d){
    if (pin.length >= 4) return
    setPin(s=>s+d)
  }

  useEffect(()=>{
    if (pin.length === 4){
      // validate
      const ok = mockApi.validatePin(profile?.employee_id, pin)
      if (ok){ onAuth(profile) }
      else { setError(true); setTimeout(()=>{ setPin(''); setError(false) }, 800) }
    }
  },[pin])

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="glass rounded-xl p-6 grid grid-cols-2 gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Abbott Water Filters</h1>
          <p className="text-sm text-gray-300">Trusted Water Solutions — Kamran Plaza, Mandian Abbottabad</p>

          <div className="mt-6">
            <label className="text-xs">Employee ID</label>
            <input value={empId} onChange={e=>setEmpId(e.target.value)} className="w-full mt-2 p-3 rounded bg-white/5" placeholder="EMP-001" />
          </div>

          <div className="mt-6">
            <label className="text-xs">PIN</label>
            <div className="mt-2 flex gap-3 items-center">
              {[0,1,2,3].map(i=> (
                <motion.div key={i} animate={{ background: pin[i] ? '#00E5FF' : (error? 'red':'rgba(255,255,255,0.12)') }} className="w-4 h-4 rounded-full" />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6,7,8,9,'C',0,'<'].map(x=> (
                <button key={x} onClick={()=>{ if (x==='C') setPin(''); else if (x==='<' ) setPin(s=>s.slice(0,-1)); else appendDigit(String(x)) }} className="p-4 bg-white/5 rounded">{x}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-44 h-44 rounded-full bg-white/6 flex items-center justify-center">
            {profile ? (
              <div className="text-center">
                <div className="text-xl font-semibold">{profile.name}</div>
                <div className="text-sm text-gray-300">{profile.role}</div>
              </div>
            ) : (
              <div className="text-gray-400">Type Employee ID for preview</div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
