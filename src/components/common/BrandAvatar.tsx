import Image from "next/image";
import { Brand } from "@/store/content";

const COLORS = [
  "bg-rose-700",
  "bg-amber-700",
  "bg-emerald-700",
  "bg-cyan-700",
  "bg-violet-700",
  "bg-pink-700",
  "bg-blue-700",
  "bg-teal-700",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Props {
  brand: Brand;
  size?: "sm" | "md";
}

export default function BrandAvatar({ brand, size = "sm" }: Props) {
  const dim = size === "md" ? "w-10 h-10 text-sm" : "w-6 h-6 text-[10px]";

  if (brand.logoUrl) {
    const px = size === "md" ? 40 : 24;
    if (brand.logoUrl.startsWith("blob:")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className={`${dim} rounded-full object-cover`}
        />
      );
    }
    return (
      <Image
        src={brand.logoUrl}
        alt={brand.name}
        width={px}
        height={px}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${getColor(brand.name)} rounded-full flex items-center justify-center text-white font-mono font-bold uppercase shrink-0`}
    >
      {brand.name.charAt(0)}
    </div>
  );
}
