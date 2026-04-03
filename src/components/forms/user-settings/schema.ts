import * as yup from "yup";

export const userSettingsSchema = yup.object({
  displayName: yup.string().trim().required("Display name is required"),
  tagline: yup.string().trim().default(""),
  heroTitle: yup.string().trim().default(""),
  heroSubtitle: yup.string().trim().default(""),
  aboutText: yup.string().trim().default(""),
  customDomainEnabled: yup.boolean().default(false),
});

export type UserSettingsFormValues = yup.InferType<typeof userSettingsSchema>;
