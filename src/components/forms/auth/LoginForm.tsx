"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema, LoginFormValues } from "./schema";

interface Props {
  onSubmit: (data: LoginFormValues) => Promise<void>;
  onCancel: () => void;
  serverError?: string;
}

export default function LoginForm({ onSubmit, onCancel, serverError }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <input
        type="email"
        {...register("email")}
        placeholder="email"
        autoFocus
        className="bg-transparent border-b border-zinc-800 text-white text-[11px] py-1 outline-none caret-white placeholder:text-zinc-700 font-mono"
      />
      {errors.email && (
        <span className="text-red-500 text-[10px]">{errors.email.message}</span>
      )}
      <input
        type="password"
        {...register("password")}
        placeholder="password"
        className="bg-transparent border-b border-zinc-800 text-white text-[11px] py-1 outline-none caret-white placeholder:text-zinc-700 font-mono"
      />
      {errors.password && (
        <span className="text-red-500 text-[10px]">{errors.password.message}</span>
      )}
      {serverError && (
        <span className="text-red-500 text-[10px]">{serverError}</span>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          {isSubmitting ? "..." : "Login"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-700 hover:text-zinc-400 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
