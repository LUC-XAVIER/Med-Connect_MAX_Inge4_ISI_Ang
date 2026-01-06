import bcrypt from 'bcryptjs';

async function run() {
  const password_hash = await bcrypt.hash("admin123", 10);
  console.log("Hashed password:", password_hash);
}

run();
