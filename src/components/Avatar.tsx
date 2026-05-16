import { memo } from "react";
import { cn } from "@/lib/utils";
import { Person } from "@/lib/store";

interface AvatarProps {
  person: {
    avatar?: string;
    name?: string;
    displayName?: string;
    initials?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-14 text-lg",
};

const gradients = [
  "from-[#FF6B6B] to-[#FFE66D]",
  "from-[#4ECDC4] to-[#556270]",
  "from-[#A8E6CF] to-[#DCEDC1]",
  "from-[#FFD3B6] to-[#FFAAA5]",
  "from-[#D4FC79] to-[#96E6A1]",
  "from-[#84FAB0] to-[#8FD3F4]",
  "from-[#A1C4FD] to-[#C2E9FB]",
  "from-[#F6D365] to-[#FDA085]",
  "from-[#667EEA] to-[#764BA2]",
  "from-[#43E97B] to-[#38F9D7]",
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const PersonAvatar = memo(function PersonAvatar({ person, size = "md", className, ring }: AvatarProps) {
  const name = person.displayName || person.name || "User";
  const initials = person.initials || name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-black overflow-hidden shrink-0 relative bg-gradient-to-br text-white/90 shadow-inner",
        getGradient(name),
        sizes[size],
        ring && "ring-2 ring-surface",
        className,
      )}
    >
      <span className="select-none">{initials}</span>
      {person.avatar && (
        <img
          src={person.avatar}
          alt={name}
          className="absolute inset-0 size-full object-cover bg-surface-soft transition-opacity duration-300"
          loading="lazy"
          onLoad={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onError={(e) => {
            e.currentTarget.style.opacity = '0';
          }}
          style={{ opacity: 0 }}
        />
      )}
    </div>
  );
});

export const AvatarStack = memo(function AvatarStack({
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
});
