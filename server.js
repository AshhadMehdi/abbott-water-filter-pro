const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const { pool, runMigrations } = require('./db')
const startWhatsappWorker = require('./whatsappWorker')

const profilesRouter = require('./routes/profiles')
const customersRouter = require('./routes/customers')
const jobsRouter = require('./routes/jobs')
const inventoryRouter = require('./routes/inventory')
const feedbackRouter = require('./routes/feedback')
const whatsappRouter = require('./routes/whatsapp')
const templatesRouter = require('./routes/templates')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/api/profiles', profilesRouter)
app.use('/api/customers', customersRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/whatsapp', whatsappRouter)
app.use('/api/templates', templatesRouter)

const PORT = process.env.PORT || 4000

async function start(){
  await runMigrations()
  // start background worker for sending WhatsApp messages
  try{ startWhatsappWorker(pool, { interval: 500 }) ; console.log('WhatsApp worker started') }catch(e){ console.warn('Could not start WhatsApp worker', e.message) }
  app.listen(PORT, ()=> console.log('Server running on', PORT))
}

start().catch(err=>{ console.error(err); process.exit(1) })
