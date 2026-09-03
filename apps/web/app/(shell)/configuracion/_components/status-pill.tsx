interface Props {
  isActive: boolean;
  description: string;
}

export function StatusPill({ isActive, description }: Props) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? "bg-success/10 text-success" : "bg-neutral-100 text-neutral-700"
      }`}
    >
      {description}
    </span>
  );
}
