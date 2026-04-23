/**
 * Seed a new admin user.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx script/createAdminUser.ts <email> <password> [name]
 *
 * Example:
 *   npx tsx script/createAdminUser.ts ops@accesstonorth.com 'S0me-Strong-Pass' "Ops Team"
 *
 * The password is hashed with bcrypt (12 rounds) before insert. Emails are
 * stored lowercased. If a user with the same email already exists, the script
 * exits with code 2 and prints a message.
 */
import bcrypt from "bcryptjs";
import { storage } from "../server/storage";

async function main() {
  const [email, password, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(" ").trim() || null;

  if (!email || !password) {
    console.error("Usage: npx tsx script/createAdminUser.ts <email> <password> [name]");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const existing = await storage.getAdminUserByEmail(email);
  if (existing) {
    console.error(`An admin user with email ${email} already exists (id=${existing.id}).`);
    process.exit(2);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await storage.createAdminUser({
    email,
    name,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log(`Created admin user #${user.id}: ${user.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
