import type { MDXComponents } from "mdx/types";
import Image from "next/image";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    img: (props) => (
      <Image
        {...props}
        alt={props.alt || ""}
        width={props.width ? Number(props.width) : 800}
        height={props.height ? Number(props.height) : 600}
      />
    ),
    ...components,
  };
}
