import * as yup from "yup";

export const projectSettingsSchema = yup.object({
  label: yup.string().trim().required("Label is required"),
  sectionName: yup.string().trim().default(""),
  filmedAt: yup.string().trim().default(""),
  pinned: yup.boolean().default(false),
  hideFromHome: yup.boolean().default(false),
  excludeFromGallery: yup.boolean().default(false),
  youtubeTitle: yup.string().trim().default(""),
  instagramTitle: yup.string().trim().default(""),
  tagInput: yup.string().trim().default(""),
  brands: yup.array().of(
    yup.object({
      id: yup.string().required(),
      name: yup.string().required(),
      logoUrl: yup.string().default(""),
      socialUrl: yup.string().optional(),
      review: yup.string().optional(),
    })
  ).default([]),
  tags: yup.array().of(
    yup.object({ value: yup.string().trim().required() })
  ).default([]),
});

export type ProjectSettingsFormValues = yup.InferType<typeof projectSettingsSchema>;

export const addBrandSchema = yup.object({
  name: yup.string().trim().required("Brand name is required"),
  socialUrl: yup.string().trim().url("Must be a valid URL").default(""),
  review: yup.string().trim().default(""),
  logoPreview: yup.string().default(""),
});

export type AddBrandFormValues = yup.InferType<typeof addBrandSchema>;
