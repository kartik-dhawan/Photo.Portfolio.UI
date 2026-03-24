const BASE = "/api/routes";

export const API_ROUTES = {
  list: BASE,
  create: BASE,
  update: (id: string) => `${BASE}/update/${id}`,
  delete: (id: string) => `${BASE}/delete/${id}`,
} as const;

const CONTENT_BASE = "/api/content";

export const CONTENT_API_ROUTES = {
  get: (slug: string) => `${CONTENT_BASE}/${slug}`,
  save: (slug: string) => `${CONTENT_BASE}/${slug}`,
  upload: `${CONTENT_BASE}/upload`,
  deleteMedia: `${CONTENT_BASE}/delete-media`,
  allBrands: `${CONTENT_BASE}/brands`,
} as const;
