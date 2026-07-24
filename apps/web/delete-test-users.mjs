import { createRequire } from "module";
const admin = createRequire(import.meta.url)("firebase-admin");

const creds = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

const app = admin.initializeApp({ credential: admin.credential.cert(creds) });
const auth = admin.auth();
const testEmails = [
  "admin@el-bannawy.app",
  "teacher@el-bannawy.app",
  "student@el-bannawy.app",
  "student2@el-bannawy.app",
  "parent@el-bannawy.app",
];

async function main() {
  console.log("Project:", process.env.FIREBASE_PROJECT_ID);
  console.log("\n── All Users ──");
  let page;
  do {
    const result = await auth.listUsers(100, page);
    for (const u of result.users) {
      const isTest = testEmails.includes(u.email || "");
      console.log(`  ${isTest ? "⚠" : " "} ${u.email || "(no email)"}${isTest ? " [TEST]" : ""}`);
    }
    page = result.pageToken;
  } while (page);

  console.log("\n── Deleting test users ──");
  for (const email of testEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      console.log(`  ✓ ${email}`);
    } catch (err) {
      if (err.code === "auth/user-not-found") console.log(`  ~ Not found: ${email}`);
      else console.error(`  ✗ ${email}: ${err.message}`);
    }
  }
  console.log("\nDone.");
  await app.delete();
}

main().catch(console.error);
