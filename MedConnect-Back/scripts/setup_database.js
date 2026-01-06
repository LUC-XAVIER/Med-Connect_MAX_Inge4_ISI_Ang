const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connect without specifying database first
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Read and execute SQL file
    const sqlFile = path.join(__dirname, 'mysql_setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the entire SQL file
    // Split by semicolons but handle multi-line statements properly
    // Remove comments first
    let cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');

    // Split by semicolons
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.length > 10) { // Only execute meaningful statements
        try {
          await connection.query(statement);
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
            if (tableMatch) {
              console.log(`✅ Created table: ${tableMatch[1]}`);
            }
          } else if (statement.toUpperCase().includes('CREATE DATABASE')) {
            const dbMatch = statement.match(/CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
            if (dbMatch) {
              console.log(`✅ Created database: ${dbMatch[1]}`);
            }
          } else if (statement.toUpperCase().includes('USE')) {
            const useMatch = statement.match(/USE\s+`?(\w+)`?/i);
            if (useMatch) {
              console.log(`✅ Using database: ${useMatch[1]}`);
            }
          }
        } catch (err) {
          // Ignore "table already exists" and "database already exists" errors
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
            console.error(`❌ Error executing statement ${i + 1}:`, err.message);
            if (statement.length > 150) {
              console.error('Statement preview:', statement.substring(0, 150) + '...');
            } else {
              console.error('Statement:', statement);
            }
          } else {
            console.log(`ℹ️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          }
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Database:', process.env.MYSQL_DATABASE || 'medconnect');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

