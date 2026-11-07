import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/SpeakUP289";

const nextConfig: NextConfig = {
  output: "export",
  // Keep local development at `/`. The Pages workflow enables this only for
  // the project-site build so generated assets resolve beneath `/SpeakUP289`.
  basePath: isGitHubPagesBuild ? githubPagesBasePath : undefined,
  assetPrefix: isGitHubPagesBuild ? githubPagesBasePath : undefined,
  images: {
    // Static exports have no Next.js image optimization server at runtime.
    // Keep the existing next/image component architecture and emit direct assets.
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
