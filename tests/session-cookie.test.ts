import { describe, expect, it } from "vitest";
import { shouldUseSecureSessionCookie } from "@/lib/session-cookie";

describe("shouldUseSecureSessionCookie", () => {
  it("allows sessions on plain HTTP self-hosted deployments", () => {
    expect(shouldUseSecureSessionCookie("http://192.168.1.50:3000")).toBe(false);
    expect(shouldUseSecureSessionCookie("http://localhost:3000")).toBe(false);
  });

  it("uses secure cookies when the configured application URL is HTTPS", () => {
    expect(shouldUseSecureSessionCookie("https://kiroku.example.com")).toBe(true);
  });
});
