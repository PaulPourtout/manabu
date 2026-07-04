export type ParsedTotpUri = {
  secret: string
  issuer: string | null
  account: string | null
}

/** Extrait la clé base32 et les métadonnées d'une URI otpauth:// (retournée par Better Auth). */
export const parseTotpUri = (totpUri: string): ParsedTotpUri | null => {
  try {
    const url = new URL(totpUri)
    if (url.protocol !== 'otpauth:' || !url.pathname.startsWith('/totp/')) {
      return null
    }

    const secret = url.searchParams.get('secret')
    if (!secret) {
      return null
    }

    const path = decodeURIComponent(url.pathname.slice('/totp/'.length))
    const colonIndex = path.indexOf(':')
    const issuerFromPath = colonIndex >= 0 ? path.slice(0, colonIndex) : path
    const account = colonIndex >= 0 ? path.slice(colonIndex + 1) : null

    return {
      secret,
      issuer: url.searchParams.get('issuer') ?? (issuerFromPath || null),
      account: account || null,
    }
  } catch {
    return null
  }
}
