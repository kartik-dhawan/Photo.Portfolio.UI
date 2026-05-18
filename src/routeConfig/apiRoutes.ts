const BASE = "/api/routes";

export const API_ROUTES = {
  list: (userId: string) => `${BASE}?userId=${userId}`,
  create: BASE,
  update: (id: string) => `${BASE}/update/${id}`,
  delete: (id: string) => `${BASE}/delete/${id}`,
} as const;

const CONTENT_BASE = "/api/content";

export const CONTENT_API_ROUTES = {
  get: (slug: string, userId: string) => `${CONTENT_BASE}/${slug}?userId=${userId}`,
  save: (slug: string) => `${CONTENT_BASE}/${slug}`,
  settings: (slug: string) => `${CONTENT_BASE}/${slug}/settings`,
  upload: `${CONTENT_BASE}/upload`,
  uploadSignature: `${CONTENT_BASE}/upload-signature`,
  deleteMedia: `${CONTENT_BASE}/delete-media`,
  allBrands: (userId: string) => `${CONTENT_BASE}/brands?userId=${userId}`,
  collections: (userId: string) => `${CONTENT_BASE}/collections?userId=${userId}`,
} as const;

export const SETTINGS_API_ROUTES = {
  get: (userId: string) => `/api/settings?userId=${userId}`,
  update: `/api/settings`,
} as const;
