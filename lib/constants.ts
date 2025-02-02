import { join } from "path/posix";

export const IMG_UPLOAD_DIR = join(process.cwd(), "public/images");
export const META_UPLOAD_DIR = join(process.cwd(), "public/meta");
export const IMG_READ_DIR = "/api/assets/images/";
export type APIResponse<T> = { data: T; error: undefined } | { data: undefined; error: string };
