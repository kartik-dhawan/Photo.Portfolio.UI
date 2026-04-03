/**
 * Migration script: Convert single-admin portfolio to multi-tenant.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-multitenancy.ts --dry-run     # Preview changes
 *   npx tsx scripts/migrate-to-multitenancy.ts               # Execute migration
 *   npx tsx scripts/migrate-to-multitenancy.ts --rollback    # Restore from backup
 *
 * Required env vars (same as .env):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Before running:
 *   1. Set SUPER_ADMIN_UID below to your Firebase Auth UID
 *   2. Set SUPER_ADMIN_EMAIL to your email
 */

import * as admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ============ CONFIGURATION ============
const SUPER_ADMIN_UID = process.env.SUPER_ADMIN_UID ?? "REPLACE_WITH_YOUR_UID";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "REPLACE_WITH_YOUR_EMAIL";
const SUPER_ADMIN_USERNAME = "kartik";
const BACKUP_DIR = path.join(__dirname, "../backups");
const BUCKET = "photo-portfolio";

// ============ INIT ============
const isDryRun = process.argv.includes("--dry-run");
const isRollback = process.argv.includes("--rollback");

function initFirebase() {
  if (admin.apps.length) return admin.apps[0]!;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function initSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function log(msg: string) {
  const prefix = isDryRun ? "[DRY-RUN]" : "[MIGRATE]";
  console.log(`${prefix} ${msg}`);
}

// ============ BACKUP ============
async function backup(db: admin.firestore.Firestore) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const collections = ["portfolio_routes", "portfolio_content", "portfolio_settings"];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    const docs: Record<string, unknown> = {};
    snapshot.forEach((doc) => {
      docs[doc.id] = doc.data();
    });
    const filePath = path.join(BACKUP_DIR, `${col}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    log(`Backed up ${snapshot.size} docs from ${col} → ${filePath}`);
  }

  // Backup storage file manifest
  const supabase = initSupabase();
  const { data: files } = await supabase.storage.from(BUCKET).list("", {
    limit: 10000,
  });
  // List files recursively by listing each top-level folder
  const allFiles: string[] = [];
  if (files) {
    for (const item of files) {
      if (item.id === null) {
        // It's a folder, list its contents
        const { data: subFiles } = await supabase.storage
          .from(BUCKET)
          .list(item.name, { limit: 10000 });
        if (subFiles) {
          for (const sub of subFiles) {
            allFiles.push(`${item.name}/${sub.name}`);
          }
        }
      } else {
        allFiles.push(item.name);
      }
    }
  }
  const manifestPath = path.join(BACKUP_DIR, "storage_manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(allFiles, null, 2));
  log(`Backed up ${allFiles.length} storage file paths → ${manifestPath}`);
}

// ============ ROLLBACK ============
async function rollback(db: admin.firestore.Firestore) {
  const collections = ["portfolio_routes", "portfolio_content", "portfolio_settings"];
  for (const col of collections) {
    const filePath = path.join(BACKUP_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      log(`No backup found for ${col}, skipping`);
      continue;
    }
    const docs = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;

    // Delete all current docs
    const snapshot = await db.collection(col).get();
    const deleteBatch = db.batch();
    snapshot.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    // Restore from backup
    const entries = Object.entries(docs);
    // Batch in groups of 500
    for (let i = 0; i < entries.length; i += 500) {
      const batch = db.batch();
      for (const [id, data] of entries.slice(i, i + 500)) {
        batch.set(db.collection(col).doc(id), data as admin.firestore.DocumentData);
      }
      await batch.commit();
    }
    log(`Restored ${entries.length} docs to ${col}`);
  }
  log("Rollback complete. Note: Storage files were not moved back (old files kept as backup).");
}

// ============ MIGRATION STEPS ============

async function step1_createSuperAdmin(db: admin.firestore.Firestore) {
  log("Step 1: Creating super admin user doc...");
  const now = new Date().toISOString();

  const userData = {
    username: SUPER_ADMIN_USERNAME,
    displayName: "Kartik Dhawan",
    tagline: "Photographer & Videographer",
    email: SUPER_ADMIN_EMAIL,
    role: "superAdmin",
    customDomain: null,
    aboutText:
      "I'm Kartik Dhawan — a photographer and videographer based in India. I specialize in portraits, brand storytelling, and cinematic video work. My approach is rooted in natural light, honest moments, and a minimal aesthetic.\n\nOver the years, I've had the opportunity to collaborate with incredible brands and individuals, capturing everything from intimate portraits to large-scale commercial projects. Every project is a new story, and I believe in letting the subject speak for itself.\n\nWhen I'm not behind the camera, you'll find me exploring new cities, curating playlists, or working on personal film projects. I'm always open to new collaborations — feel free to reach out.",
    socials: [],
    heroTitle: "Making intentions meet cinema",
    heroSubtitle: "Video/photographer for the fearless, the open minded and the adventurous",
    createdAt: now,
    updatedAt: now,
  };

  if (!isDryRun) {
    await db.collection("users").doc(SUPER_ADMIN_UID).set(userData);
    await db.collection("usernames").doc(SUPER_ADMIN_USERNAME).set({
      userId: SUPER_ADMIN_UID,
    });
  }
  log(`  Created users/${SUPER_ADMIN_UID} and usernames/${SUPER_ADMIN_USERNAME}`);
}

async function step2_setCustomClaims() {
  log("Step 2: Setting Firebase custom claims...");
  if (!isDryRun) {
    await admin.auth().setCustomUserClaims(SUPER_ADMIN_UID, {
      role: "superAdmin",
      username: SUPER_ADMIN_USERNAME,
    });
  }
  log(`  Set claims on ${SUPER_ADMIN_UID}: role=superAdmin, username=${SUPER_ADMIN_USERNAME}`);
}

async function step3_migrateRoutes(db: admin.firestore.Firestore) {
  log("Step 3: Adding userId to portfolio_routes...");
  const snapshot = await db.collection("portfolio_routes").get();
  if (!isDryRun) {
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = db.batch();
      for (const doc of snapshot.docs.slice(i, i + 500)) {
        if (!doc.data().userId) {
          batch.update(doc.ref, { userId: SUPER_ADMIN_UID });
        }
      }
      await batch.commit();
    }
  }
  log(`  Updated ${snapshot.size} route docs with userId`);
}

async function step4_migrateContent(db: admin.firestore.Firestore) {
  log("Step 4: Migrating portfolio_content doc IDs...");
  const snapshot = await db.collection("portfolio_content").get();
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const oldId = doc.id;
    const newId = `${SUPER_ADMIN_UID}_${oldId}`;

    // Skip if already migrated (id starts with uid)
    if (oldId.startsWith(SUPER_ADMIN_UID)) {
      log(`  Skipping ${oldId} (already migrated)`);
      continue;
    }

    log(`  ${oldId} → ${newId}`);
    if (!isDryRun) {
      await db
        .collection("portfolio_content")
        .doc(newId)
        .set({ ...doc.data(), userId: SUPER_ADMIN_UID });
      await db.collection("portfolio_content").doc(oldId).delete();
    }
    migrated++;
  }
  log(`  Migrated ${migrated} content docs`);
}

async function step5_migrateSettings(db: admin.firestore.Firestore) {
  log("Step 5: Migrating portfolio_settings...");
  const generalDoc = await db.doc("portfolio_settings/general").get();
  if (generalDoc.exists) {
    const newPath = `portfolio_settings/${SUPER_ADMIN_UID}`;
    log(`  portfolio_settings/general → ${newPath}`);
    if (!isDryRun) {
      await db.doc(newPath).set(generalDoc.data()!);
      await db.doc("portfolio_settings/general").delete();
    }
  } else {
    log("  No general settings doc found, creating empty one");
    if (!isDryRun) {
      await db.doc(`portfolio_settings/${SUPER_ADMIN_UID}`).set({
        profilePhotoUrl: "",
      });
    }
  }
}

async function step6_migrateStorage(db: admin.firestore.Firestore) {
  log("Step 6: Migrating Supabase storage paths...");
  const supabase = initSupabase();

  // Get all content docs to find media URLs
  const contentSnapshot = await db
    .collection("portfolio_content")
    .where("userId", "==", SUPER_ADMIN_UID)
    .get();

  const urlMap = new Map<string, string>(); // old URL → new URL

  for (const doc of contentSnapshot.docs) {
    const data = doc.data();
    const slug = data.slug as string;

    for (const block of (data.blocks ?? []) as Array<{ type: string; media?: Array<{ url: string }> }>) {
      if (block.type !== "image" && block.type !== "youtube") continue;
      for (const media of block.media ?? []) {
        if (!media.url) continue;
        // Extract path from URL
        const match = media.url.match(/\/object\/public\/[^/]+\/(.+)$/);
        if (!match) continue;
        const oldPath = match[1];

        // Skip if already has userId prefix
        if (oldPath.startsWith(`${SUPER_ADMIN_UID}/`)) continue;

        const newPath = `${SUPER_ADMIN_UID}/${oldPath}`;
        log(`  Storage: ${oldPath} → ${newPath}`);

        if (!isDryRun) {
          // Download and re-upload (Supabase doesn't have a rename/copy API)
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(BUCKET)
            .download(oldPath);
          if (downloadError || !fileData) {
            log(`  WARNING: Failed to download ${oldPath}: ${downloadError?.message}`);
            continue;
          }

          const buffer = Buffer.from(await fileData.arrayBuffer());
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(newPath, buffer, { upsert: true });
          if (uploadError) {
            log(`  WARNING: Failed to upload ${newPath}: ${uploadError.message}`);
            continue;
          }

          // Get new public URL
          const { data: publicData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(newPath);
          urlMap.set(media.url, publicData.publicUrl);
          // Don't delete old file — keep as backup
        }
      }
    }

    // Also check brands for logoUrl
    for (const brand of (data.brands ?? []) as Array<{ logoUrl?: string }>) {
      if (!brand.logoUrl) continue;
      const match = brand.logoUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
      if (!match) continue;
      const oldPath = match[1];
      if (oldPath.startsWith(`${SUPER_ADMIN_UID}/`)) continue;

      const newPath = `${SUPER_ADMIN_UID}/${oldPath}`;
      log(`  Storage (brand): ${oldPath} → ${newPath}`);

      if (!isDryRun) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(BUCKET)
          .download(oldPath);
        if (downloadError || !fileData) continue;

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newPath, buffer, { upsert: true });
        if (uploadError) continue;

        const { data: publicData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(newPath);
        urlMap.set(brand.logoUrl, publicData.publicUrl);
      }
    }
  }

  // Update URLs in Firestore content docs
  if (!isDryRun && urlMap.size > 0) {
    log(`  Updating ${urlMap.size} URLs in content docs...`);
    for (const doc of contentSnapshot.docs) {
      const data = doc.data();
      let updated = false;
      let jsonStr = JSON.stringify(data);

      for (const [oldUrl, newUrl] of urlMap) {
        if (jsonStr.includes(oldUrl)) {
          jsonStr = jsonStr.replaceAll(oldUrl, newUrl);
          updated = true;
        }
      }

      if (updated) {
        await doc.ref.update(JSON.parse(jsonStr));
        log(`  Updated URLs in ${doc.id}`);
      }
    }
  }

  // Also update profilePhotoUrl in settings
  const settingsDoc = await db.doc(`portfolio_settings/${SUPER_ADMIN_UID}`).get();
  if (settingsDoc.exists) {
    const profileUrl = settingsDoc.data()?.profilePhotoUrl;
    if (profileUrl && urlMap.has(profileUrl)) {
      if (!isDryRun) {
        await settingsDoc.ref.update({ profilePhotoUrl: urlMap.get(profileUrl) });
      }
      log(`  Updated profile photo URL in settings`);
    }
  }

  log(`  Storage migration complete. Old files kept as backup.`);
}

// ============ MAIN ============
async function main() {
  // Load env from .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }

  if (SUPER_ADMIN_UID === "REPLACE_WITH_YOUR_UID") {
    console.error("ERROR: Set SUPER_ADMIN_UID before running this script.");
    console.error("You can find your UID in Firebase Console → Authentication → Users");
    process.exit(1);
  }

  initFirebase();
  const db = admin.firestore();

  if (isRollback) {
    log("=== ROLLBACK MODE ===");
    await rollback(db);
    return;
  }

  log(isDryRun ? "=== DRY RUN ===" : "=== EXECUTING MIGRATION ===");

  // Backup first
  await backup(db);

  // Run migration steps
  await step1_createSuperAdmin(db);
  await step2_setCustomClaims();
  await step3_migrateRoutes(db);
  await step4_migrateContent(db);
  await step5_migrateSettings(db);
  await step6_migrateStorage(db);

  log("\n=== MIGRATION COMPLETE ===");
  if (isDryRun) {
    log("This was a dry run. No changes were made.");
    log("Run without --dry-run to execute.");
  } else {
    log("Backup saved in ./backups/");
    log("Old storage files kept — delete manually after verification.");
    log("\nIMPORTANT: User must log out and log back in for custom claims to take effect.");
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
