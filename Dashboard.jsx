import React, { useState, useEffect } from 'react'
import { Button } from 'lucide-react'
import mockApi from '../services/mockApi'
import WhatsAppHub from './WhatsAppHub'
import TemplateManager from './TemplateManager'
import QueueAdmin from './QueueAdmin'
import { motion } from 'framer-motion'

function Header({user, onSignOut, seconds}){
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <img src="/logo.jpeg" alt="logo" className="w-12 h-12 rounded-md" />
        <div>
          <div className="font-bold">Abbott Water Filters</div>
          <div className="text-sm text-gray-300">Trusted Water Solutions</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm">Session: {Math.floor(seconds/60)}:{('0'+(seconds%60)).slice(-2)}</div>
        <button onClick={onSignOut} className="text-sm bg-white/5 p-2 rounded">Sign out</button>
      </div>
    </div>
  )
}

export default function Dashboard({ user, onSignOut }){
  const [seconds, setSeconds] = useState(0)
  const [role, setRole] = useState(user.role || 'Manager')
  const [customers, setCustomers] = useState([])
  const [jobs, setJobs] = useState([])
  const [inventory, setInventory] = useState([])

  useEffect(()=>{ mockApi.seed(); setCustomers(mockApi.getCustomers()) }, [])
  useEffect(()=>{ (async ()=>{ setJobs(await mockApi.getJobs()); setInventory(await mockApi.getInventory()) })() }, [])

  useEffect(()=>{ const id = setInterval(()=>setSeconds(s=>s+1),1000); return ()=>clearInterval(id) },[])

  function whatsappAllOverdue(){
    const overdue = customers.filter(c=> c.due_date && new Date(c.due_date) < new Date())
    ;(async ()=>{
      for (const c of overdue){
        const text = `Dear ${c.name}, your water filter is overdue for service.`
        try{
          // enqueue on server
          await mockApi.sendWhatsapp({ phone: c.phone, message: text, template_used: 'Overdue Urgent', sent_by: user.id })
          // log locally as well
          await mockApi.logWhatsapp({ customer_name: c.name, template_used: 'Overdue Urgent', sent_by: user.id })
        }catch(e){ console.warn('WhatsApp enqueue failed', e.message) }
        await new Promise(r=>setTimeout(r,300))
      }
    })()
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl">
        <Header user={user} onSignOut={onSignOut} seconds={seconds} />

        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Dashboard — {role}</h2>
            <div className="flex gap-2">
              <select value={role} onChange={e=>setRole(e.target.value)} className="p-2 bg-white/5 rounded">
                <option>Manager</option>
                <option>Technician</option>
                <option>Sales Staff</option>
              </select>
              <button onClick={whatsappAllOverdue} className="p-2 bg-aquacyan text-black rounded">WhatsApp All Overdue</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 glass rounded">Total Customers<br/>{customers.length}</div>
            <div className="p-4 glass rounded">Overdue<br/>{customers.filter(c=> c.due_date && new Date(c.due_date) < new Date()).length}</div>
            <div className="p-4 glass rounded">Due This Month<br/>{customers.filter(c=> c.due_date && (new Date(c.due_date) - new Date())/ (1000*60*60*24) <= 30).length}</div>
          </div>

          <div className="mt-6">
            {role === 'Manager' && (
              <div>
                <h3 className="font-semibold">Dynamic Lifespan Monitor</h3>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {customers.map(c=> (
                    <div key={c.id} className="p-3 glass rounded">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-sm">Due: {c.due_date}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold">Jobs</h4>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {jobs.map(j=> (
                      <div key={j.id} className="p-3 glass rounded">
                        <div className="font-bold">{j.job_id || '—'}</div>
                        <div className="text-sm">Type: {j.job_type}</div>
                        <div className="text-sm">Status: {j.status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold">Inventory</h4>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {inventory.map(it=> (
                      <div key={it.id} className="p-3 glass rounded">
                        <div className="font-bold">{it.item_name}</div>
                        <div className="text-sm">Stock: {it.current_stock}</div>
                        <div className="text-sm">Reorder: {it.reorder_level}</div>
                      </div>
                    ))}
                    <div className="p-3 glass rounded">
                      <button className="p-2 bg-aquacyan text-black rounded" onClick={async ()=>{
                        const newIt = await mockApi.createInventory({ item_name: 'New Item', category: 'Other', current_stock: 10, reorder_level: 5, unit: 'Pcs', supplier: 'Local' })
                        setInventory(s=>[...s, newIt])
                      }}>Quick Add Item</button>
                    </div>
                  </div>
                </div>

                <WhatsAppHub customers={customers} user={user} />
                <TemplateManager />
                <QueueAdmin />
              </div>
            )}

            {role === 'Technician' && (
              <div>
                <h3 className="font-semibold">Your Assigned Work Orders</h3>
                <div className="mt-3">(Technician portal - limited view)</div>
              </div>
            )}

            {role === 'Sales Staff' && (
              <div>
                <h3 className="font-semibold">Sales Pipeline</h3>
                <div className="mt-3">(Pipeline view)</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
