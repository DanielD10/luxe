import type { Photo } from "../types";

export const p = (id: string, page: string, by: string, alt: string, named: boolean): Photo => ({
  id,
  page,
  by,
  alt,
  named,
});
