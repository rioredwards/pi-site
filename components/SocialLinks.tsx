import BlueSky from "@/components/svg/Bluesky";
import GitHub from "@/components/svg/GitHub";
import LinkedIn from "@/components/svg/LinkedIn";
import YouTube from "@/components/svg/YouTube";
import ImgPersonalWebsiteIcon from "@/public/images/personal-website-icon.svg";
import Image from "next/image";
import Link from "next/link";

const iconClassNameDefault = "w-8 transition-transform hover:scale-105";
const linkProps = { target: "_blank" as const, rel: "noreferrer" as const };

type SocialLinksProps = {
  /** Class name for the wrapper div. */
  className?: string;
  /** Class name for icon elements. Default includes hover scale. */
  iconClassName?: string;
};

export function SocialLinks({
  className,
  iconClassName = iconClassNameDefault,
}: SocialLinksProps) {
  return (
    <div className={className ?? "flex gap-4"}>
      <Link href="https://rioedwards.com" className="group block" {...linkProps} aria-label="Personal Website">
        <Image
          src={ImgPersonalWebsiteIcon}
          alt="Personal Website"
          className={`${iconClassName} transition-transform group-hover:scale-105`}
        />
      </Link>
      <Link
        href="https://www.linkedin.com/in/rio-edwards/"
        aria-label="LinkedIn"
        {...linkProps}
      >
        <LinkedIn className={iconClassName} />
      </Link>
      <Link
        href="https://bsky.app/profile/rioedwards.bsky.social"
        aria-label="Bluesky"
        {...linkProps}
      >
        <BlueSky className={iconClassName} />
      </Link>
      <Link
        href="https://www.youtube.com/channel/UCZdVYjS_Os_4e7DZAZSRxBQ"
        aria-label="YouTube"
        {...linkProps}
      >
        <YouTube className={iconClassName} />
      </Link>
      <Link href="https://github.com/rioredwards/" aria-label="GitHub" {...linkProps}>
        <GitHub className={iconClassName} />
      </Link>
    </div>
  );
}
