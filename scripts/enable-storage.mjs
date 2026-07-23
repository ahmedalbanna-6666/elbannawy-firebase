import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "..", "apps", "web"));

const { google } = require("googleapis");
const { JWT } = require("google-auth-library");

const PROJECT_ID = "elbannawy-platform-f0a73";
const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@elbannawy-platform-f0a73.iam.gserviceaccount.com";
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7qXZKJfJGtS1g\n1HhGj5toxXOai7XSt7J23nLEwFAfTftpJDVkW1ugb5FWDQwe66JKrZhhmSUUDYBe\nTDEwrNFm65KFDKW3cF/RfrK4+mGP6ltwuduMK0/IK2KSE1twKh1cBGUWo5G8c9t7\nquxodv9Pid2UtUL/vYeuLpwkGMjxgCSjbBtUVEm84VZy/fGBIWq9ZrjODG1dahYz\nmhVoHKETVO5pvnaDK+e3iRiMfSANS7Z3JFvAwudwhUuVNZcksnNzLUKX2VqrClQg\nJiP8coHDdz4xP0obadkXBBAfhY+rboMJgtB7qFya0PWkLXEY+dvkCpSfanGbxXnL\nGGp5JB8fAgMBAAECggEATDfICNZ/n5MvQoAY94OU+YkUakTrDJG6RIgVce6vu/8m\nqK3hl4h5XuBhVWNINHi8efsmhCE4i3vuUp48bkoKZHQyFqKr3aSg7gu41+MtY8+p\n4s9BqZzfsutYBf8hqJ0aPoi0a+z0IGen0YL6sHUAPdQ/MAosk4TtSeO5W/nLBzYy\nx1tzOYXbnYSgsn8y2lvIxL6pc1diT8c9YaO/zvsBWU4J9vShcrD/w3XERjEhNNhv\n7TrsoobRI/4m46bxt13HoxQFTsWWB2pwk/EyQj2JQAXXOHdmGonu9NKDk/UcDZvg\nNp5MnE7LONJdWoW1o6IbMdk8Kj6te4jlLkBTAWPe4QKBgQD05zcaGApNbIBBSguI\noXpRxgCErboAqFtlTkIuTRkTlZ0XaOPnwtiozC0/+yIF/ILodl8txEWSalOuuUyC\nGHEUb8sgt14RiNkKRq1V4vJjX7RgoRvHk94M7TkBDkmYj0QtaKt1rk0+ODowA4Nz\n44KHpkK3EAQZOvtGOztHEhoKYQKBgQDEKkUqqMpo7GVP+J+lTSKGhY9ChOfjNekU\nTlCaeB7A14x/8FlKmgrUWbjSubU+uA82qCE8r/2XtK0HUwwD3ODhlviBtcBC26RX\nNaypdiK4k2gU1BFOwgCXKsZFKtbzO2KdRpBzWHj4ywgp0kgC/tSKfZcaeqQ0TMgF\nW2J2LiWZfwKBgQCSS3B6EPROjcsLtVywcK2uHZZ/q3uaGvgFyzrzh7C8JzqhGlJS\nRu2/38AEIVOQuefFT7jJkR5yOTvl+uD+MfWS3Lk9wOvbk6D7Z37x+FENFcWdl4AN\nt4IEvMy5mbxS+voiGg2ajdWsnk/8EI089CIsQCBIVLPuEnK54HYnnWOa4QKBgQCf\nIuOFnfTGdbAi1kE86nxtwP/dKNCthFiXfojpJzVboAF88NCfMqRCbJ8BZGJihRLi\ndjawct05KvuLi5WdtJxCpiTnpThZhLGnhgWSXCICtqKi8v8vczbja3H5Pq2uGKkB\nifM5f7ZzrtHqi4qb03s89nGUq5V2UCucHOydjwY1pQKBgGNBJywAKJVc3kdSyPps\nNu63YKZbqNK4KMuvRc6LHS+Cs/PY8os8TOBkeU5y1gSsnYOKS3Cxzc/oOLAsBkEK\n6nmA7rhkudw3kbXhTCTyrpaAjjF9n4/Ovdtqjh6W1m70hSz+iRsLshK7NgIviqq/\nEYdHKkJxntApy/yGjBsVZbKn\n-----END PRIVATE KEY-----\n`;

async function enableStorage() {
  const auth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  // 1. Enable the Firebase Storage API
  console.log("Enabling firebasestorage.googleapis.com...");
  try {
    const serviceusage = google.serviceusage({ version: "v1", auth });
    await serviceusage.services.enable({
      name: `projects/${PROJECT_ID}/services/firebasestorage.googleapis.com`,
    });
    console.log("  ✓ API enabled");
  } catch (e) {
    if (e.errors?.[0]?.message?.includes("already enabled")) {
      console.log("  ~ API already enabled");
    } else {
      console.log("  ~ API enable skipped:", e.errors?.[0]?.message || e.message);
    }
  }

  // 2. Create the default storage bucket
  console.log("Creating default storage bucket...");
  try {
    const storage = google.storage({ version: "v1", auth });
    const bucketName = `${PROJECT_ID}.firebasestorage.app`;
    await storage.buckets.insert({
      project: PROJECT_ID,
      requestBody: {
        name: bucketName,
        location: "ME-CENTRAL1",
        storageClass: "STANDARD",
        labels: {
          "firebase": "storage",
          "firebase-product": "storage",
        },
      },
    });
    console.log(`  ✓ Bucket created: ${bucketName}`);
  } catch (e) {
    if (e.errors?.[0]?.message?.includes("already exists")) {
      console.log("  ~ Bucket already exists");
    } else {
      console.log("  ✗ Bucket creation failed:", e.errors?.[0]?.message || e.message);
    }
  }

  console.log("\n✅ Storage setup complete!");
}

enableStorage().catch((err) => {
  console.error("Storage setup failed:", err);
  process.exit(1);
});
