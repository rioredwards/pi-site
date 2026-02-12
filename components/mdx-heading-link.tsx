"use client";

import { Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReactNode } from "react";

interface HeadingLinkProps {
  slug: string;
  children: ReactNode;
}

export function HeadingLink({ slug, children }: HeadingLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${slug}`);
    }
  };

  return (
    <a href={`#${slug}`} onClick={handleClick} className="anchor no-underline">
      {children}
      <HugeiconsIcon
        icon={Link01Icon}
        size={16}
        className="ml-2 inline-block align-middle text-inherit opacity-0 transition-opacity group-hover:opacity-100"
      />
    </a>
  );
}
