export type BlockType = 'image' | 'richtext' | 'spacer' | 'youtube';
export type ImageLayout = 'full' | 'half';
export type AspectRatio = '16/9' | '1/1' | '4/5' | '9/16';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
  date?: string;
  duration?: number; // seconds, for video
  link?: string;
  brandId?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  socialUrl?: string;
  review?: string;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  layout?: ImageLayout;
  aspectRatio?: AspectRatio;
  media?: MediaItem[];
  markdown?: string;
  order: number;
}

export interface PageContent {
  slug: string;
  blocks: ContentBlock[];
  brands?: Brand[];
  tags?: string[];
  filmedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ContentState {
  pages: Record<string, PageContent>;
  drafts: Record<string, ContentBlock[]>;
  draftBrands: Record<string, Brand[]>;
  loading: boolean;
  saving: boolean;
  error: string | null;
}
