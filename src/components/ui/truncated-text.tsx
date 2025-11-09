import { useState } from "react";
import { Button } from "./button";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export const TruncatedText = ({ 
  text, 
  maxLength = 190, 
  className = "" 
}: TruncatedTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? text 
    : `${text.slice(0, maxLength)}...`;

  return (
    <div className={className}>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
        {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="link"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="h-auto p-0 text-primary hover:text-primary/80 text-xs font-semibold mt-1"
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </Button>
      )}
    </div>
  );
};
