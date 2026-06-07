const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM whatsapp_logs ORDER BY sent_at DESC')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

router.post('/', async (req,res)=>{
  const { customer_name, template_used, sent_at, sent_by } = req.body
  try{
    const { rows } = await pool.query(
      `INSERT INTO whatsapp_logs (customer_name, template_used, sent_at, sent_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [customer_name, template_used, sent_at || new Date(), sent_by || null]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Enqueue a WhatsApp message into the queue for processing by the worker
router.post('/send', async (req,res)=>{
  const { phone, message, template_used, sent_by } = req.body
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })
  try{
    const { rows } = await pool.query(
      `INSERT INTO whatsapp_queue (phone, message, template_used, sent_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [phone, message, template_used || null, sent_by || null]
    )
    res.status(201).json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Admin: view queue
router.get('/queue', async (req,res)=>{
  try{
    const { rows } = await pool.query('SELECT * FROM whatsapp_queue ORDER BY queued_at, queued_at IS NULL')
    res.json(rows)
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Admin: requeue message (set status to pending and queued_at now)
router.post('/queue/:id/requeue', async (req,res)=>{
  try{
    const { rows } = await pool.query("UPDATE whatsapp_queue SET status = 'pending', queued_at = now(), attempts = 0 WHERE id = $1 RETURNING *", [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  }catch(err){ res.status(500).json({ error: err.message }) }
})

// Admin: delete queued item
router.delete('/queue/:id', async (req,res)=>{
  try{
    await pool.query('DELETE FROM whatsapp_queue WHERE id = $1',[req.params.id])
    res.status(204).end()
  }catch(err){ res.status(500).json({ error: err.message }) }
})

module.exports = router
