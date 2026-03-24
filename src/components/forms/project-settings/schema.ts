import * as yup from "yup";

export const projectSettingsSchema = yup.object({
  name: yup.string().trim().required("Brand name is required"),
  socialUrl: yup.string().trim().url("Must be a valid URL").default(""),
  review: yup.string().trim().default(""),
});

export type ProjectSettingsFormValues = yup.InferType<typeof projectSettingsSchema>;
