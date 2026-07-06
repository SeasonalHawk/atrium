// PRD v5 Section 7: the inbound funnel deploys to Vercel with no special
// build configuration. Placeholder until Phase 1 "Scaffold funnel and
// console apps" adds real config (image domains, redirects, etc).
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@atrium/shared"],
};

export default nextConfig;
