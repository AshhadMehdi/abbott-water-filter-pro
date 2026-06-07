import React, { useEffect, useState } from 'react'
import mockApi from '../services/mockApi'

export default function WhatsAppHub({ customers, user }){
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [preview, setPreview] = useState('')

  useEffect(()=>{ (async ()=>{ setTemplates(await mockApi.getTemplates()) })() }, [])

  async function handleSelectTemplate(id){
    setSelectedTemplate(id)
    const c = customers[0] || {}
    const context = { name: c.name, install_date: c.install_date, due_date: c.due_date, scheduled_date: '', scheduled_time: '', technician: '' }
    const r = await mockApi.renderTemplate(id, context)
    setPreview(r?.rendered || '')
  }

  function toggleCustomer(id){
    setSelectedCustomers(s=> s.includes(id) ? s.filter(x=>x!==id) : [...s,id])
  }

  async function sendToSelected(){
    const tpl = templates.find(t=> t.id === selectedTemplate)
    if (!tpl) return
    for (const cid of selectedCustomers){
      const c = customers.find(x=> x.id === cid)
      const context = { name: c.name, install_date: c.install_date, due_date: c.due_date }
      const r = await mockApi.renderTemplate(tpl.id, context)
      const text = r?.rendered || tpl.body
      await mockApi.sendWhatsapp({ phone: c.phone, message: text, template_used: tpl.template_key, sent_by: user.id })
      await new Promise(r=>setTimeout(r,300))
    }
  }

  return (
    <div className="mt-6">
      <h4 className="font-semibold">WhatsApp Command Hub</h4>
      <div className="grid grid-cols-3 gap-4 mt-3">
        <div className="p-3 glass rounded">
          <div className="font-semibold">Templates</div>
          <div className="mt-2">
            {templates.map(t=> (
              <div key={t.id} className="flex items-center justify-between mt-2">
                <div>{t.name}</div>
                <button onClick={()=>handleSelectTemplate(t.id)} className="p-1 bg-white/5 rounded">Preview</button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 glass rounded col-span-1">
          <div className="font-semibold">Recipients</div>
          <div className="mt-2 max-h-56 overflow-auto">
            {customers.map(c=> (
              <label key={c.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedCustomers.includes(c.id)} onChange={()=>toggleCustomer(c.id)} />
                <span className="text-sm">{c.name} — {c.phone}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-3 glass rounded col-span-1">
          <div className="font-semibold">Preview</div>
          <div className="mt-2 p-2 bg-white/5 rounded h-40 overflow-auto">{preview}</div>
          <div className="mt-4 flex gap-2">
            <button onClick={sendToSelected} className="p-2 bg-aquacyan text-black rounded">Send to Selected</button>
          </div>
        </div>
      </div>
    </div>
  )
}
