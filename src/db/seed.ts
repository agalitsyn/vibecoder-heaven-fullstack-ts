import "dotenv/config";
import { db } from "./index";
import * as schema from "./schema";
import { auth } from "../lib/auth";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  // Clear existing data
  await db.delete(schema.documents);
  await db.delete(schema.apikey);
  await db.delete(schema.session);
  await db.delete(schema.account);
  await db.delete(schema.user);

  // Create users via Better Auth API (handles password hashing)
  const userResult = await auth.api.signUpEmail({
    body: {
      email: "user@example.com",
      password: "useruser",
      name: "User",
    },
  });

  if (!userResult?.user) {
    throw new Error("Failed to create seed user");
  }

  console.log("Created 1 user");

  // Create sample documents
  const now = new Date();
  const documents = await db
    .insert(schema.documents)
    .values([
      {
        id: createId(),
        title: "Getting Started Guide",
        userId: userResult.user.id,
        updatedAt: now,
      },
      {
        id: createId(),
        title: "Project Roadmap",
        userId: userResult.user.id,
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: createId(),
        title: "Architecture Overview",
        userId: userResult.user.id,
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ])
    .returning();

  console.log(`Created ${documents.length} documents`);

  console.log("Seed completed!");
  console.log("Test user:");
  console.log("  user@example.com / useruser (user)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
