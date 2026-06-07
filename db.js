const fs = require('fs')
const { Pool } = require('pg')
const path = require('path')
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function runMigrations(){
  const dir = path.join(__dirname, '..', 'migrations')
  try{
    const files = fs.readdirSync(dir).filter(f=> f.endsWith('.sql')).sort()
    for (const f of files){
      const sql = fs.readFileSync(path.join(dir,f), 'utf8')
      try{
        await pool.query(sql)
        console.log('Applied migration', f)
      }catch(err){
        console.warn('Migration', f, 'error (may already be applied):', err.message)
      }
    }
  }catch(err){ console.error('Migration runner error:', err.message) }
}

module.exports = { pool, runMigrations }
