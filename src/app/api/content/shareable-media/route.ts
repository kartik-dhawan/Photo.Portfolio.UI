import { verifyAuth } from "@/lib/auth";
import { getAdminDb } from "@/firebase/admin";
import { ContentBlock, MediaItem } from "@/store/content/types";
import type { Timestamp } from "firebase-admin/firestore";

export interface ShareableMediaItem {
  url: string;
  type: "image" | "video";
  projectSlug: string;
  projectName: string;
  ownerUserId: string;
  ownerUsername: string;
  ownerDisplayName: string;
  isOwnContent: boolean;
  contentDate: string; // ISO timestamp from the content doc's updatedAt/createdAt
}

type RawItem = Omit<ShareableMediaItem, "ownerUsername" | "ownerDisplayName">;

function toIso(ts: unknown): string {
  if (!ts) return new Date(0).toISOString();
  // Firestore Timestamp object
  if (typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate().toISOString();
  }
  // ISO string (stored via new Date().toISOString())
  if (typeof ts === "string") return ts;
  // Epoch millis
  if (typeof ts === "number") return new Date(ts).toISOString();
  return new Date(0).toISOString();
}

export async function GET(request: Request) {
  const authUser = await verifyAuth(request);
  if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get("pageSize") ?? "30")));
  const filter = searchParams.get("filter") === "all" ? "all" : "mine";

  const db = getAdminDb();
  const rawItems: RawItem[] = [];

  if (filter === "mine") {
    const [myContentSnapshot, myRoutesSnapshot] = await Promise.all([
      db.collection("portfolio_content").where("userId", "==", authUser.uid).get(),
      db.collection("portfolio_routes").where("userId", "==", authUser.uid).get(),
    ]);

    const myRouteLabels = new Map<string, string>();
    for (const doc of myRoutesSnapshot.docs) {
      const data = doc.data();
      const slug = (data.route as string)?.replace(/^\//, "");
      if (slug) myRouteLabels.set(slug, data.label as string);
    }

    for (const doc of myContentSnapshot.docs) {
      const data = doc.data();
      const slug = data.slug as string;
      const projectName = myRouteLabels.get(slug) ?? slug;
      const contentDate = toIso(data.updatedAt ?? data.createdAt);
      for (const block of (data.blocks ?? []) as ContentBlock[]) {
        if (block.type !== "image") continue;
        for (const media of (block.media ?? []) as MediaItem[]) {
          if (media.type !== "image" || !media.url?.startsWith("http")) continue;
          rawItems.push({
            url: media.url,
            type: "image",
            projectSlug: slug,
            projectName,
            ownerUserId: authUser.uid,
            isOwnContent: true,
            contentDate,
          });
        }
      }
    }
  } else {
    // filter === "all": only other users' shareable content
    const shareableRoutesSnapshot = await db
      .collection("portfolio_routes")
      .where("isShareable", "==", true)
      .get();

    const otherUserRoutes = shareableRoutesSnapshot.docs.filter(
      (d) => d.data().userId !== authUser.uid
    );

    if (otherUserRoutes.length > 0) {
      const routeLabelMap = new Map<string, string>();
      for (const doc of otherUserRoutes) {
        const data = doc.data();
        const slug = (data.route as string)?.replace(/^\//, "");
        if (slug) routeLabelMap.set(`${data.userId}_${slug}`, data.label as string);
      }

      const contentDocIds = otherUserRoutes.map((d) => {
        const data = d.data();
        const slug = (data.route as string)?.replace(/^\//, "");
        return `${data.userId}_${slug}`;
      });

      const contentDocs = await db.getAll(
        ...contentDocIds.map((id) => db.collection("portfolio_content").doc(id))
      );

      for (const doc of contentDocs) {
        if (!doc.exists) continue;
        const data = doc.data()!;
        const ownerUserId = data.userId as string;
        const slug = data.slug as string;
        const projectName = routeLabelMap.get(`${ownerUserId}_${slug}`) ?? slug;
        const contentDate = toIso(data.updatedAt ?? data.createdAt);

        for (const block of (data.blocks ?? []) as ContentBlock[]) {
          if (block.type !== "image") continue;
          for (const media of (block.media ?? []) as MediaItem[]) {
            if (media.type !== "image" || !media.url?.startsWith("http")) continue;
            rawItems.push({
              url: media.url,
              type: "image",
              projectSlug: slug,
              projectName,
              ownerUserId,
              isOwnContent: false,
              contentDate,
            });
          }
        }
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = rawItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by contentDate descending (most recently updated first)
  deduped.sort((a, b) => b.contentDate.localeCompare(a.contentDate));

  // Enrich with user display info
  const ownerUids = [...new Set(deduped.map((i) => i.ownerUserId))];
  const userMap = new Map<string, { username: string; displayName: string }>();
  if (ownerUids.length > 0) {
    const userDocs = await db.getAll(
      ...ownerUids.map((uid) => db.collection("users").doc(uid))
    );
    for (const doc of userDocs) {
      if (!doc.exists) continue;
      const d = doc.data()!;
      userMap.set(doc.id, {
        username: (d.username as string) ?? "",
        displayName: (d.displayName as string) ?? "",
      });
    }
  }

  const total = deduped.length;
  const start = (page - 1) * pageSize;
  const items: ShareableMediaItem[] = deduped.slice(start, start + pageSize).map((item) => {
    const user = userMap.get(item.ownerUserId);
    return {
      ...item,
      ownerUsername: user?.username ?? "",
      ownerDisplayName: user?.displayName ?? "",
    };
  });

  return Response.json({ items, total, page, pageSize, hasMore: start + pageSize < total });
}
