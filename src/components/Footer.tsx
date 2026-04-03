export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 h-[30px] flex items-center justify-center gap-3 bg-black/90 backdrop-blur-sm border-t border-zinc-900 text-[9px] font-mono text-zinc-600 tracking-wider">
      <span>
        Developed by{" "}
        <a
          href="https://linkedin.com/in/kartikdhawan07"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
        >
          Kartik Dhawan
        </a>
      </span>
      <span className="text-zinc-800">|</span>
      <a
        href="https://instagram.com/notkartikk"
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-500 hover:text-white transition-colors"
      >
        Instagram
      </a>
      <span className="text-zinc-800">|</span>
      <a
        href="mailto:kartikkdhawan@gmail.com"
        className="text-zinc-500 hover:text-white transition-colors"
      >
        Email
      </a>
    </footer>
  );
}
