import pg from 'pg'
const { Client } = pg
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const config = {
    user: 'postgres',
    host: 'data.greenland77.ge',
    database: 'postgres',
    password: '3mppdicb2bihqjmjs3ks20xfdxydppxm',
    port: 5432,
    ssl: false // Self-hosted often doesn't enforce SSL or uses self-signed. Try false first.
}

async function applyMigration(client, filename) {
    try {
        console.log(`\n🔧 Applying migration: ${filename}...`)
        const migrationPath = join(__dirname, '..', 'database', 'migrations', filename)
        console.log(`📄 Reading migration file: ${migrationPath}`)

        const migrationSQL = readFileSync(migrationPath, 'utf-8')
        console.log('📊 Migration size:', migrationSQL.length, 'characters')

        await client.query(migrationSQL)
        console.log('✅ Migration applied successfully!')

        // Record migration
        await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name text PRIMARY KEY,
        executed_at timestamptz DEFAULT now()
      );
    `)

        await client.query(`
      INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING
    `, [filename.replace('.sql', '')])

    } catch (error) {
        console.error(`❌ Error applying ${filename}:`, error.message)
        throw error
    }
}

async function run() {
    const client = new Client(config)
    try {
        await client.connect()
        console.log('✅ Connected to Postgres')

        await applyMigration(client, '20251125_create_deliveries_table.sql')

        console.log('\n🎉 All pending migrations applied!')
    } catch (err) {
        console.error('Connection error', err.stack)
    } finally {
        await client.end()
    }
}

run()
