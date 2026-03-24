"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addRouteSchema, AddRouteFormValues } from "./schema";

interface Props {
  onAdd: (label: string, sectionName: string) => void;
  onCancel: () => void;
}

export default function AddRouteForm({ onAdd, onCancel }: Props) {
  const labelRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddRouteFormValues>({
    resolver: yupResolver(addRouteSchema),
    defaultValues: { label: "", sectionName: "" },
  });

  const { ref: labelRegRef, ...labelRest } = register("label");

  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  const onSubmit = (data: AddRouteFormValues) => {
    onAdd(data.label, data.sectionName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2"
      onKeyDown={handleKeyDown}
    >
      <input
        {...labelRest}
        ref={(el) => {
          labelRegRef(el);
          labelRef.current = el;
        }}
        type="text"
        placeholder="label"
        className="bg-transparent border-b border-zinc-700 text-white text-sm py-1 outline-none caret-white placeholder:text-zinc-700 font-mono w-full"
      />
      {errors.label && (
        <span className="text-red-500 text-[10px]">{errors.label.message}</span>
      )}
      <input
        {...register("sectionName")}
        type="text"
        placeholder="section name"
        className="bg-transparent border-b border-zinc-700 text-white text-sm py-1 outline-none caret-white placeholder:text-zinc-700 font-mono w-full"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-600 hover:text-red-400 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
