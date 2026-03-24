import * as yup from "yup";

export const projectSettingsSchema = yup.object({
  label: yup.string().trim().required("Label is required"),
  filmedAt: yup.string().trim().default(""),
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
});

export type AddBrandFormValues = yup.InferType<typeof addBrandSchema>;
