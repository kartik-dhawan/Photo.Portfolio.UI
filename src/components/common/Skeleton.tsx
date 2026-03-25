interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = "", style }: Props) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-800/60 ${className}`}
      style={style}
    />
  );
}
