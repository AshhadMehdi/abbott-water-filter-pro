const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM customer_feedback ORDER BY created_at DESC')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.post('/', async (req,res)=>{
  const { customer_name, phone, rating, type, comment } = req.body
  try{
    const { rows } = await pool.query(
      `INSERT INTO customer_feedback (customer_name, phone, rating, type, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [customer_name, phone, rating, type, comment]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
