/**
 * MetroX 3D — Admin Account Provisioning Script
 * Usage: npx tsx scripts/create-admin.ts [email] [password] [fullName]
 */

import bcrypt from 'bcryptjs';
import { inMemoryDB } from '../server/db/connection.js';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@metrox.internal';
  const password = args[1] || 'Admin@123';
  const fullName = args[2] || 'System Administrator';

  console.log(`[MetroX Provisioner] Generating admin account for: ${email}`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const existing = inMemoryDB.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.role = 'admin';
    existing.password_hash = passwordHash;
    console.log(`✓ Updated existing account ${email} to Administrator role.`);
  } else {
    inMemoryDB.users.push({
      user_id: inMemoryDB.users.length + 1,
      full_name: fullName,
      email: email.toLowerCase(),
      phone: '+91 98765 43210',
      password_hash: passwordHash,
      role: 'admin',
      account_status: 'active',
      created_at: new Date().toISOString(),
    });
    console.log(`✓ Successfully provisioned new Administrator account: ${email}`);
  }

  console.log('\nDefault Development Credentials:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('Role: admin\n');
}

createAdmin().catch(console.error);
