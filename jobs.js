const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM jobs ORDER BY scheduled_date NULLS LAST')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1',[req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.post('/', async (req,res)=>{
  const { job_id, customer_id, technician_id, job_type, scheduled_date, scheduled_time, status, labor_charge, parts_cost, notes } = req.body
  try{
    const { rows } = await pool.query(
      `INSERT INTO jobs (job_id, customer_id, technician_id, job_type, scheduled_date, scheduled_time, status, labor_charge, parts_cost, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [job_id, customer_id, technician_id, job_type, scheduled_date, scheduled_time, status || 'Scheduled', labor_charge || 0, parts_cost || 0, notes || null]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req,res)=>{
  const id = req.params.id
  const fields = ['job_id','customer_id','technician_id','job_type','scheduled_date','scheduled_time','status','labor_charge','parts_cost','notes']
  const updates = []
  const values = []
  fields.forEach((f,i)=>{ if (f in req.body){ values.push(req.body[f]); updates.push(`${f} = $${values.length}`) } })
  if (!updates.length) return res.status(400).json({ error: 'No fields' })
  values.push(id)
  const sql = `UPDATE jobs SET ${updates.join(',')}, updated_at = now() WHERE id = $${values.length} RETURNING *`
  try{
    const { rows } = await pool.query(sql, values)
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req,res)=>{
  try{
    await pool.query('DELETE FROM jobs WHERE id = $1',[req.params.id])
    res.status(204).end()
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
