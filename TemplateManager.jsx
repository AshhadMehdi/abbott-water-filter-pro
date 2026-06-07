import React, { useEffect, useState } from 'react'
import mockApi from '../services/mockApi'

export default function TemplateManager(){
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', template_key:'', body:'' })

  useEffect(()=>{ (async ()=>{ setTemplates(await mockApi.getTemplates()) })() }, [])

  function startEdit(t){ setEditing(t.id); setForm({ name: t.name, template_key: t.template_key, body: t.body }) }
  function resetForm(){ setEditing(null); setForm({ name:'', template_key:'', body:'' }) }

  async function save(){
    try{
      if (editing) {
        const r = await mockApi.updateTemplate(editing, { name: form.name, body: form.body })
        setTemplates(s=> s.map(x=> x.id===editing? r : x))
      } else {
        const r = await mockApi.createTemplate(form)
        setTemplates(s=> [...s, r])
      }
      resetForm()
    }catch(e){ alert('Save failed: '+e.message) }
  }

  async function remove(id){ if (!confirm('Delete template?')) return; await mockApi.deleteTemplate(id); setTemplates(s=> s.filter(x=> x.id!==id)) }

  return (
    <div className="mt-6">
      <h4 className="font-semibold">Template Manager</h4>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div className="p-3 glass rounded">
          <div className="space-y-2">
            {templates.map(t=> (
              <div key={t.id} className="flex items-center justify-between">
                <div>{t.name}</div>
                <div className="flex gap-2">
                  <button onClick={()=>startEdit(t)} className="p-1 bg-white/5 rounded">Edit</button>
                  <button onClick={()=>remove(t.id)} className="p-1 bg-red-600 rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 glass rounded">
          <div className="space-y-2">
            <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-2 bg-white/5 rounded" />
            <input placeholder="Key (unique)" value={form.template_key} onChange={e=>setForm({...form, template_key: e.target.value})} className="w-full p-2 bg-white/5 rounded" disabled={!!editing} />
            <textarea placeholder="Body with {{placeholders}}" value={form.body} onChange={e=>setForm({...form, body: e.target.value})} className="w-full p-2 bg-white/5 rounded h-40" />
            <div className="flex gap-2">
              <button onClick={save} className="p-2 bg-aquacyan text-black rounded">Save</button>
              <button onClick={resetForm} className="p-2 bg-white/5 rounded">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
