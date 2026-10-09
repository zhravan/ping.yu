import { describe, expect, it } from "vitest";
import { daysUntilExpiry, getCertificateHealth, type CertificateProbe } from "../src/domain/certificate";

const now = Date.parse("2026-10-09T00:00:00.000Z");
const probe = (overrides: Partial<CertificateProbe> = {}): CertificateProbe => ({
  region: "Europe",
  country: "Germany",
  tls_authorized: 1,
  tls_expires_at: "2026-12-08T00:00:00.000Z",
  tls_subject: "example.com",
  tls_issuer: "Example CA",
  tls_protocol: "TLSv1.3",
  ...overrides,
});

describe("SSL certificate health", () => {
  it("returns unknown when no TLS certificate data has been reported", () => {
    expect(getCertificateHealth([probe({
      tls_authorized: null,
      tls_expires_at: null,
      tls_subject: null,
      tls_issuer: null,
      tls_protocol: null,
    })], now)).toBe("unknown");
  });

  it("marks a certificate healthy when expiry is more than 30 days away", () => {
    expect(getCertificateHealth([probe()], now)).toBe("healthy");
  });

  it("warns when a certificate expires within 30 days", () => {
    expect(getCertificateHealth([probe({ tls_expires_at: "2026-10-30T00:00:00.000Z" })], now)).toBe("warning");
  });

  it("marks a certificate critical within 14 days or when untrusted", () => {
    expect(getCertificateHealth([probe({ tls_expires_at: "2026-10-20T00:00:00.000Z" })], now)).toBe("critical");
    expect(getCertificateHealth([probe({ tls_authorized: 0 })], now)).toBe("critical");
  });

  it("calculates days until expiry", () => {
    expect(daysUntilExpiry("2026-10-10T00:00:00.000Z", now)).toBe(1);
    expect(daysUntilExpiry("invalid", now)).toBeNull();
  });
});
