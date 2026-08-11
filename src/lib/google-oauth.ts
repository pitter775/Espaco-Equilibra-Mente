function cleanEnv(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function getSiteOrigin(origin: string) {
  const publicSiteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL);
  if (!publicSiteUrl) return origin;

  try {
    return new URL(publicSiteUrl).origin;
  } catch {
    return origin;
  }
}

export function getGoogleOAuthConfig(origin: string) {
  const siteOrigin = getSiteOrigin(origin);

  return {
    clientId: cleanEnv(process.env.GOOGLE_CLIENT_ID),
    clientSecret: cleanEnv(process.env.GOOGLE_CLIENT_SECRET),
    redirectUri: cleanEnv(process.env.GOOGLE_REDIRECT_URI) || `${siteOrigin}/login/google/callback`,
  };
}
