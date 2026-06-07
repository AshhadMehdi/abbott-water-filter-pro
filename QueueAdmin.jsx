import React, { useEffect, useState } from 'react'
import mockApi from '../services/mockApi'

export default function QueueAdmin(){
  const [queue, setQueue] = useState([])

  async function refresh(){ setQueue(await mockApi.getQueue()) }
  useEffect(()=>{ refresh(); const id = setInterval(refresh, 5000); return ()=>clearInterval(id) }, [])

  async function requeue(id){ await mockApi.requeue(id); refresh() }
  async function remove(id){ if (!confirm('Delete queued item?')) return; await mockApi.deleteQueued(id); refresh() }

  return (
    <div className="mt-6">
      <h4 className="font-semibold">WhatsApp Queue Admin</h4>
      <div className="mt-3 p-3 glass rounded max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead><tr><th>Phone</th><th>Message</th><th>Status</th><th>Attempts</th><th>Actions</th></tr></thead>
          <tbody>
            {queue.map(q=> (
              <tr key={q.id} className="border-t border-white/5">
                <td className="p-2">{q.phone}</td>
                <td className="p-2">{q.message}</td>
                <td className="p-2">{q.status}</td>
                <td className="p-2">{q.attempts}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={()=>requeue(q.id)} className="p-1 bg-aquacyan rounded text-black">Requeue</button>
                  <button onClick={()=>remove(q.id)} className="p-1 bg-red-600 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
