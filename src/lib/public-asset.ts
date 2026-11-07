const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefixes files from `public/` only for the project-site static export.
 * Local development intentionally keeps these paths rooted at `/`.
 */
export function publicAsset(path: `/${string}`) {
  return `${publicBasePath}${path}`;
}
