import { SOCIALS } from "@/lib/socials";

export default function SocialLinks() {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col gap-3">
      {SOCIALS.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          title={social.name}
          className="text-zinc-600 hover:text-white transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d={social.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
}
