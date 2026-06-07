const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM inventory ORDER BY item_name')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.post('/', async (req,res)=>{
  const { item_name, category, current_stock, reorder_level, unit, supplier } = req.body
  try{
    const { rows } = await pool.query(
      `INSERT INTO inventory (item_name, category, current_stock, reorder_level, unit, supplier) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [item_name, category, current_stock || 0, reorder_level || 0, unit, supplier]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req,res)=>{
  const id = req.params.id
  const fields = ['item_name','category','current_stock','reorder_level','unit','supplier']
  const updates = []
  const values = []
  fields.forEach((f,i)=>{ if (f in req.body){ values.push(req.body[f]); updates.push(`${f} = $${values.length}`) } })
  if (!updates.length) return res.status(400).json({ error: 'No fields' })
  values.push(id)
  const sql = `UPDATE inventory SET ${updates.join(',')}, updated_at = now() WHERE id = $${values.length} RETURNING *`
  try{
    const { rows } = await pool.query(sql, values)
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req,res)=>{
  try{
    await pool.query('DELETE FROM inventory WHERE id = $1',[req.params.id])
    res.status(204).end()
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
