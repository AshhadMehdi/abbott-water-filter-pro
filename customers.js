const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT id, customer_id, name, phone, address, area, filter_model, lifespan_months, install_date, due_date, created_by FROM customers ORDER BY name')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.post('/', async (req,res)=>{
  const { customer_id, name, phone, address, area, filter_model, lifespan_months, install_date, created_by } = req.body
  try{
    const { rows } = await pool.query(
      `INSERT INTO customers (customer_id, name, phone, address, area, filter_model, lifespan_months, install_date, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [customer_id, name, phone, address, area, filter_model, lifespan_months || 6, install_date || null, created_by || null]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
