import { cn } from "@/lib/utils";
import { Person } from "@/lib/store";

interface AvatarProps {
  person: Person;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

const sizes = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-14",
};

export function PersonAvatar({ person, size = "md", className, ring }: AvatarProps) {
  return person.avatar ? (
    <img
      src={person.avatar}
      alt={person.name}
      width={56}
      height={56}
      loading="lazy"
      className={cn(
        "rounded-full object-cover bg-surface-soft",
        sizes[size],
        ring && "ring-2 ring-surface",
        className,
      )}
    />
  ) : (
    <div
      className={cn(
        "rounded-full bg-brand-soft text-brand-soft-foreground flex items-center justify-center font-bold",
        sizes[size],
        ring && "ring-2 ring-surface",
        className,
      )}
    >
      {person.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

export function AvatarStack({
  people: list,
  max = 4,
  size = "md",
}: {
  people: Person[];
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const visible = list.slice(0, max);
  const extra = list.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((p) => (
        <PersonAvatar key={p.id} person={p} size={size} ring />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "ring-2 ring-surface rounded-full bg-surface-soft text-ink-soft flex items-center justify-center font-medium text-[11px]",
            sizes[size],
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
