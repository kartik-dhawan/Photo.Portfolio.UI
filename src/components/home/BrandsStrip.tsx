"use client";

interface Brand {
  name: string;
  logoUrl: string;
  socialUrl?: string;
}

interface Props {
  brands: Brand[];
}

export default function BrandsStrip({ brands }: Props) {
  if (brands.length === 0) return null;

  // Build enough items so one "copy" is wider than any viewport,
  // then duplicate for the seamless -50% translateX loop.
  const perItemPx = 52; // w-8 (32px) + gap-5 (20px)
  const minCopyPx = 2000;
  const repeats = Math.ceil(minCopyPx / (brands.length * perItemPx));
  const singleCopy = Array.from({ length: repeats }, () => brands).flat();
  const loopItems = [...singleCopy, ...singleCopy];

  return (
    <div className="relative w-[250px] md:w-[350px] mt-8" style={{ clipPath: 'inset(0)' }}>
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #000 0%, transparent 30%, transparent 70%, #000 100%)' }} />
      <div
        className="flex gap-5 items-center animate-marquee"
        style={{ width: "max-content" }}
      >
        {loopItems.map((brand, i) => {
          const inner = (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              title={brand.name}
              className="w-8 h-8 rounded-full object-cover bg-zinc-900 border border-zinc-900 transition-transform duration-200 hover:scale-110"
            />
          );
          return brand.socialUrl ? (
            <a
              key={i}
              href={brand.socialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 block"
              onClick={(e) => e.stopPropagation()}
            >
              {inner}
            </a>
          ) : (
            <div key={i} className="shrink-0">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
