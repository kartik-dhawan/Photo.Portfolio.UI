import { ContentState } from "./types";

export const initialState: ContentState = {
  pages: {},
  drafts: {},
  draftBrands: {},
  loading: false,
  saving: false,
  error: null,
};
