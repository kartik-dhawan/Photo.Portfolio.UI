import * as yup from "yup";

export const addRouteSchema = yup.object({
  label: yup.string().trim().required("Label is required"),
  sectionName: yup.string().trim().default(""),
});

export type AddRouteFormValues = yup.InferType<typeof addRouteSchema>;
