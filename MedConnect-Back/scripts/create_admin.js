const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'medconnect',
    });

    console.log('✅ Connected to MySQL server');

    // Default admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@medconnect.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT user_id FROM users WHERE email = ? AND role = ?',
      [adminEmail, 'admin']
    );

    if (existing.length > 0) {
      console.log('ℹ️  Admin user already exists with email:', adminEmail);
      console.log('   To reset password, update the ADMIN_PASSWORD in .env and run this script again');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const [result] = await connection.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [adminFirstName, adminLastName, adminEmail, passwordHash, 'admin', true]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the default password after first login!');
    console.log('\n💡 To customize admin credentials, set these environment variables:');
    console.log('   ADMIN_EMAIL=your-email@example.com');
    console.log('   ADMIN_PASSWORD=YourSecurePassword');
    console.log('   ADMIN_FIRST_NAME=YourFirstName');
    console.log('   ADMIN_LAST_NAME=YourLastName');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();




