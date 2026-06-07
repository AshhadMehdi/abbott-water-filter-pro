const profiles = [
  { id: '11111111-1111-1111-1111-111111111111', employee_id: 'EMP-001', name: 'Javed', role: 'Technician', phone: '923481234567' },
  { id: '22222222-2222-2222-2222-222222222222', employee_id: 'EMP-002', name: 'Ayesha', role: 'Manager', phone: '923482345678' }
]

let customers = [
  { id: 'c1', name: 'Ali Khan', phone: '923488115410', install_date: '2025-01-01', lifespan_months: 6, due_date: '2025-07-01' },
  { id: 'c2', name: 'Sara', phone: '923488115411', install_date: '2024-01-01', lifespan_months: 6, due_date: '2024-07-01' }
]

const API_BASE = import.meta.env.VITE_API_BASE || ((typeof window !== 'undefined' && window.__API_BASE__) || 'http://localhost:4000')
import supabase from '../lib/supabaseClient'

export default {
  seed(){ /* placeholder if needed */ },
  async getProfileByEmployeeId(empId){
    try{
      if (supabase){
        const { data, error } = await supabase.from('profiles').select('id,employee_id,name,role,phone,shift,area,is_active').eq('employee_id', empId).limit(1)
        if (error) throw error
        return data?.[0] || null
      }
      const res = await fetch(`${API_BASE}/api/profiles/${encodeURIComponent(empId)}`)
      if (!res.ok) return profiles.find(p=> p.employee_id === empId) || null
      return await res.json()
    }catch(e){ return profiles.find(p=> p.employee_id === empId) || null }
  },
  validatePin(empId, pin){
    if (!empId) return false
    if (empId === 'EMP-001') return pin === '1234'
    if (empId === 'EMP-002') return pin === '0000'
    return false
  },
  async getCustomers(){
    try{
      const res = await fetch(`${API_BASE}/api/customers`)
      if (!res.ok) return customers
      return await res.json()
    }catch(e){ return customers }
  }
  ,
  // Jobs
  async getJobs(){
    try{ const res = await fetch(`${API_BASE}/api/jobs`); if (!res.ok) return []; return await res.json() }catch(e){ return [] }
  },
  async createJob(data){ try{ const res = await fetch(`${API_BASE}/api/jobs`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } },

  // Inventory
  async getInventory(){ try{ const res = await fetch(`${API_BASE}/api/inventory`); if (!res.ok) return []; return await res.json() }catch(e){ return [] } },
  async createInventory(data){ try{ const res = await fetch(`${API_BASE}/api/inventory`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } },

  // Feedback
  async getFeedback(){ try{ const res = await fetch(`${API_BASE}/api/feedback`); if (!res.ok) return []; return await res.json() }catch(e){ return [] } },
  async createFeedback(data){ try{ const res = await fetch(`${API_BASE}/api/feedback`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } },

  // WhatsApp logs
  async getWhatsapps(){ try{ const res = await fetch(`${API_BASE}/api/whatsapp`); if (!res.ok) return []; return await res.json() }catch(e){ return [] } },
  async logWhatsapp(data){ try{ const res = await fetch(`${API_BASE}/api/whatsapp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } }
  ,
  async sendWhatsapp(data){ try{ const res = await fetch(`${API_BASE}/api/whatsapp/send`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } }
  ,
  // Templates
  async getTemplates(){ try{ const res = await fetch(`${API_BASE}/api/templates`); if (!res.ok) return []; return await res.json() }catch(e){ return [] } },
  async renderTemplate(id, context){ try{ const res = await fetch(`${API_BASE}/api/templates/${id}/render`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(context) }); if (!res.ok) return null; return await res.json() }catch(e){ return null } }
  ,
  async createTemplate(data){ try{ const res = await fetch(`${API_BASE}/api/templates`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } },
  async updateTemplate(id, data){ try{ const res = await fetch(`${API_BASE}/api/templates/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }); return await res.json() }catch(e){ throw e } },
  async deleteTemplate(id){ try{ const res = await fetch(`${API_BASE}/api/templates/${id}`, { method:'DELETE' }); return res.ok }catch(e){ return false } },

  // Admin queue
  async getQueue(){ try{ const res = await fetch(`${API_BASE}/api/whatsapp/queue`); if (!res.ok) return []; return await res.json() }catch(e){ return [] } },
  async requeue(id){ try{ const res = await fetch(`${API_BASE}/api/whatsapp/queue/${id}/requeue`, { method:'POST' }); return await res.json() }catch(e){ throw e } },
  async deleteQueued(id){ try{ const res = await fetch(`${API_BASE}/api/whatsapp/queue/${id}`, { method:'DELETE' }); return res.ok }catch(e){ return false } }
}
