import React from "react";

interface Props {
  src: string; // public watermarked URL
  alt?: string;
  onClick?: () => void;
  className?: string;
}

// Renders a watermarked image while discouraging download
export const UserPhotoCard: React.FC<Props> = ({ src, alt = "", onClick, className = "" }) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={onClick}
      className={
        "relative overflow-hidden rounded-xl bg-black/10 select-none " +
        "[user-select:none] " + // Removed touch-action:none to enable touch scrolling
        className
      }
    >
      {/* The actual image is not interactable but allows touch events for scrolling */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block w-full h-full object-cover select-none touch-pan-y"
        draggable={false}
        onDragStart={handleDragStart}
        style={{ pointerEvents: 'none' }}
      />

      {/* Transparent overlay to intercept long-press, but still allow click-through */}
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        onClick={onClick}
      />

      {/* Optional subtle CSS watermark text overlay (defense-in-depth). The real watermark is baked server-side. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <span
          className="opacity-25 text-white text-[4vw] md:text-3xl font-bold tracking-widest whitespace-nowrap select-none"
          style={{
            textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
            transform: "rotate(-18deg)",
          }}
        >
          Sensual Nexus
        </span>
      </div>
    </div>
  );
};

export default UserPhotoCard;
