declare module "culori/css";
declare module "culori/fn" {
  export function formatCss(color: any): string | undefined;
  export function useMode(mode: any): (color: string) => any;
  export const modeOklch: any;
}
