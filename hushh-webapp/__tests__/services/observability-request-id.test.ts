import { describe, expect, it } from "vitest";

import {
  FUTURE_TIMESTAMP_ERROR,
  INVALID_TIMESTAMP_ERROR,
  REQUEST_ID_HEADER,
  REQUEST_TIMESTAMP_HEADER,
  getOrCreateRequestId,
  getOrCreateRequestTimestampMs,
  sanitizeRequestId,
  validateHeaderTimestampConstraints,
} from "@/lib/observability/request-id";

describe("sanitizeRequestId", () => {
  it("accepts valid request ids", () => {
    expect(sanitizeRequestId("abc12345")).toBe("abc12345");
  });

  it("trims valid request ids", () => {
    expect(sanitizeRequestId("  abc12345  ")).toBe("abc12345");
  });

  it("rejects invalid request ids", () => {
    expect(sanitizeRequestId("")).toBeNull();
    expect(sanitizeRequestId("bad id")).toBeNull();
    expect(sanitizeRequestId("%%%%")).toBeNull();
  });
});

describe("getOrCreateRequestId", () => {
  it("uses a valid header value", () => {
    const result = getOrCreateRequestId(
      new Headers({
        [REQUEST_ID_HEADER]: "abc12345",
      })
    );

    expect(result).toBe("abc12345");
  });

  it("creates a replacement for invalid header values", () => {
    const result = getOrCreateRequestId(
      new Headers({
        [REQUEST_ID_HEADER]: "bad id",
      })
    );

    expect(result).toBeTruthy();
    expect(result).not.toBe("bad id");
  });
});

describe("validateHeaderTimestampConstraints", () => {
  it("accepts valid timestamps", () => {
    expect(
      validateHeaderTimestampConstraints(900, {
        nowMs: 1000,
      })
    ).toEqual({
      isSyncBlockAccepted: true,
      errorLabel: null,
    });
  });

  it("rejects invalid timestamps", () => {
    expect(
      validateHeaderTimestampConstraints(Number.NaN)
    ).toEqual({
      isSyncBlockAccepted: false,
      errorLabel: INVALID_TIMESTAMP_ERROR,
    });
  });

  it("rejects timestamps too far in the future", () => {
    expect(
      validateHeaderTimestampConstraints(62000, {
        nowMs: 0,
      })
    ).toEqual({
      isSyncBlockAccepted: false,
      errorLabel: FUTURE_TIMESTAMP_ERROR,
    });
  });
});

describe("getOrCreateRequestTimestampMs", () => {
  it("uses a valid timestamp header", () => {
    const result = getOrCreateRequestTimestampMs(
      new Headers({
        [REQUEST_TIMESTAMP_HEADER]: "500",
      }),
      1000
    );

    expect(result).toBe(500);
  });

  it("falls back to nowMs for invalid timestamps", () => {
    const result = getOrCreateRequestTimestampMs(
      new Headers({
        [REQUEST_TIMESTAMP_HEADER]: "abc",
      }),
      1000
    );

    expect(result).toBe(1000);
  });
});
