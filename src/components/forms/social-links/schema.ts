import * as yup from "yup";

export const socialLinksSchema = yup.object({
  instagram: yup.string().trim().default(""),
  youtube: yup.string().trim().default(""),
  twitter: yup.string().trim().default(""),
  linkedin: yup.string().trim().default(""),
  spotify: yup.string().trim().default(""),
});

export type SocialLinksFormValues = yup.InferType<typeof socialLinksSchema>;
