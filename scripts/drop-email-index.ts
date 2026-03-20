import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://madhusudhanyella8_db_user:E6KbeBlWA21avzv6@cluster0.hxqbiig.mongodb.net/vipani?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  try {
    await db.collection("users").dropIndex("email_1");
    console.log("Dropped email_1 index");
  } catch (e: unknown) {
    console.log("No email_1 index to drop:", (e as Error).message);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
