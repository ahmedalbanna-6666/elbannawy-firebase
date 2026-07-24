const { cert } = require("firebase-admin");
const pk = process.env.FIREBASE_PRIVATE_KEY;
console.log("Length:", pk.length);
console.log("Starts with:", pk.substring(0, 40));
console.log("Ends with:", pk.substring(pk.length - 40));
console.log("Has literal \\n:", pk.includes("\\n"));
console.log("Has actual newlines:", pk.includes("\n"));
const parsed = pk.replace(/\\n/g, "\n");
console.log("After replace - first line:", parsed.split("\n")[0]);
try {
  cert({
    projectId: "elbannawy-platform-f0a73",
    clientEmail: "firebase-adminsdk-fbsvc@elbannawy-platform-f0a73.iam.gserviceaccount.com",
    privateKey: parsed,
  });
  console.log("SUCCESS: private key is valid");
} catch (e) {
  console.log("ERROR:", e.message);
}
