// Simple worker that polls whatsapp_queue for pending messages and sends them.
// If Twilio env vars are set, it will use Twilio's WhatsApp API; otherwise it simulates sends.

const Twilio = require('twilio')

module.exports = function startWhatsappWorker(pool, opts={ interval: 3000, maxAttempts: 5 }){
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || null
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || null
  const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || null
  const useTwilio = TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM
  const twClient = useTwilio ? Twilio(TWILIO_SID, TWILIO_TOKEN) : null

  let running = true
  async function tick(){
    if (!running) return
    try{
      const client = await pool.connect()
      try{
        await client.query('BEGIN')
        const q = await client.query("SELECT * FROM whatsapp_queue WHERE status = 'pending' AND (queued_at IS NULL OR queued_at <= now()) ORDER BY queued_at FOR UPDATE SKIP LOCKED LIMIT 1")
        if (q.rows.length === 0){
          await client.query('COMMIT')
        } else {
          const msg = q.rows[0]
          try{
            if (useTwilio){
              // send via Twilio WhatsApp
              const to = msg.phone.startsWith('+') ? `whatsapp:${msg.phone}` : `whatsapp:+${msg.phone}`
              const from = `whatsapp:${TWILIO_FROM}`
              const res = await twClient.messages.create({ to, from, body: msg.message })
              await client.query('UPDATE whatsapp_queue SET status = $1, attempts = attempts+1, sent_at = now() WHERE id = $2', ['sent', msg.id])
              await client.query('INSERT INTO whatsapp_logs (customer_name, template_used, sent_at, sent_by) VALUES ($1,$2,now(),$3)', [msg.phone, msg.template_used || msg.message, msg.sent_by || null])
              console.log('Twilio sent', res.sid)
            } else {
              // Simulate send
              await new Promise(r=>setTimeout(r, 200))
              await client.query('UPDATE whatsapp_queue SET status = $1, attempts = attempts+1, sent_at = now() WHERE id = $2', ['sent', msg.id])
              await client.query('INSERT INTO whatsapp_logs (customer_name, template_used, sent_at, sent_by) VALUES ($1,$2,now(),$3)', [msg.phone, msg.template_used || msg.message, msg.sent_by || null])
              console.log('Simulated send to', msg.phone)
            }
            await client.query('COMMIT')
          }catch(err){
            // handle retry/backoff
            const attempts = (msg.attempts || 0) + 1
            if (attempts >= opts.maxAttempts){
              await client.query('UPDATE whatsapp_queue SET attempts = $1, status = $2 WHERE id = $3', [attempts, 'failed', msg.id])
              console.error('Message failed permanently', msg.id, err.message)
            } else {
              // schedule next attempt with exponential backoff (in seconds)
              const delay = Math.min(60, Math.pow(2, attempts) * 5)
              await client.query("UPDATE whatsapp_queue SET attempts = $1, queued_at = now() + ($2 || ' seconds')::interval, status = 'pending' WHERE id = $3", [attempts, delay, msg.id])
              console.warn('Message scheduled for retry', msg.id, 'in', delay, 'seconds')
            }
            await client.query('COMMIT')
          }
        }
      }finally{ client.release() }
    }catch(err){ console.error('Whatsapp worker error', err.message) }
    setTimeout(tick, opts.interval)
  }
  tick()
  return ()=>{ running = false }
}
