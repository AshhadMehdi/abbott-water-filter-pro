const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// Allowed placeholders for templates
const ALLOWED_PLACEHOLDERS = new Set(['name','install_date','due_date','scheduled_date','scheduled_time','technician','feedback_link'])

function validateTemplateBody(body){
  const matches = body.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || []
  for (const m of matches){
    const key = m.replace(/{{|}}|\s/g,'')
    if (!ALLOWED_PLACEHOLDERS.has(key)) return { ok:false, invalid:key }
  }
  return { ok:true }
}

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM whatsapp_templates ORDER BY name')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM whatsapp_templates WHERE id = $1',[req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Render template with simple placeholder replacement for a given customer/context
router.post('/:id/render', async (req,res)=>{
  const id = req.params.id
  const context = req.body || {}
  try{
    const { rows } = await pool.query('SELECT * FROM whatsapp_templates WHERE id = $1',[id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    let body = rows[0].body
    // simple replacement for {{key}} with safe keys only
    const invalid = body.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)?.map(t=> t.replace(/{{|}}|\s/g,''))?.find(k=> !ALLOWED_PLACEHOLDERS.has(k))
    if (invalid) return res.status(400).json({ error: 'Template contains invalid placeholder', placeholder: invalid })
    body = body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_,k)=> context[k] || '')
    res.json({ rendered: body })
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Create template
router.post('/', async (req,res)=>{
  const { name, template_key, body, created_by } = req.body
  if (!name || !template_key || !body) return res.status(400).json({ error: 'name, template_key and body required' })
  const v = validateTemplateBody(body)
  if (!v.ok) return res.status(400).json({ error: 'Invalid placeholder', placeholder: v.invalid })
  try{
    const { rows } = await pool.query('INSERT INTO whatsapp_templates (name, template_key, body, created_by) VALUES ($1,$2,$3,$4) RETURNING *', [name, template_key, body, created_by || null])
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Update template
router.put('/:id', async (req,res)=>{
  const id = req.params.id
  const { name, body } = req.body
  if (body){
    const v = validateTemplateBody(body)
    if (!v.ok) return res.status(400).json({ error: 'Invalid placeholder', placeholder: v.invalid })
  }
  try{
    const { rows } = await pool.query('UPDATE whatsapp_templates SET name = COALESCE($1,name), body = COALESCE($2,body), updated_at = now() WHERE id = $3 RETURNING *', [name || null, body || null, id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Delete template
router.delete('/:id', async (req,res)=>{
  try{
    await pool.query('DELETE FROM whatsapp_templates WHERE id = $1',[req.params.id])
    res.status(204).end()
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
