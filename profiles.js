const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT id, employee_id, name, role, phone, shift, area, is_active FROM profiles')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.get('/:employee_id', async (req,res)=>{
  const emp = req.params.employee_id
  try{
    const { rows } = await pool.query('SELECT id, employee_id, name, role, phone, shift, area, is_active FROM profiles WHERE employee_id = $1 LIMIT 1',[emp])
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
