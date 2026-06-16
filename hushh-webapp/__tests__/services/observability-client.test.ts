import { describe, expect, it } from "vitest";

import {
  toDurationBucket,
  toEventResult,
  toStatusBucket,
} from "@/lib/observability/client";

describe("toStatusBucket", () => {
  it("returns network_error when status code is null", () => {
    expect(
      toStatusBucket(
        null,
        "GET",
        "/api/test"
      )
    ).toBe("network_error");
  });

  it("maps successful responses to 2xx", () => {
    expect(
      toStatusBucket(
        200,
        "GET",
        "/api/test"
      )
    ).toBe("2xx");
  });

  it("maps redirect responses to 3xx", () => {
    expect(
      toStatusBucket(
        302,
        "GET",
        "/api/test"
      )
    ).toBe("3xx");
  });

  it("maps expected client errors to 4xx_expected", () => {
    expect(
      toStatusBucket(
        401,
        "GET",
        "/api/kai/market/insights/{user_id}"
      )
    ).toBe("4xx_expected");
  });

  it("maps unexpected client errors to 4xx_unexpected", () => {
    expect(
      toStatusBucket(
        404,
        "GET",
        "/api/test"
      )
    ).toBe("4xx_unexpected");
  });

  it("maps server errors to 5xx", () => {
    expect(
      toStatusBucket(
        500,
        "GET",
        "/api/test"
      )
    ).toBe("5xx");
  });
});

describe("toEventResult", () => {
  it("maps success buckets correctly", () => {
    expect(toEventResult("2xx")).toBe("success");
    expect(toEventResult("3xx")).toBe("success");
  });

  it("maps expected errors correctly", () => {
    expect(toEventResult("4xx_expected")).toBe("expected_error");
  });

  it("maps failures correctly", () => {
    expect(toEventResult("4xx_unexpected")).toBe("error");
    expect(toEventResult("5xx")).toBe("error");
    expect(toEventResult("network_error")).toBe("error");
  });
});

describe("toDurationBucket", () => {
  it("maps representative durations", () => {
    expect(toDurationBucket(50)).toBe("lt_100ms");
    expect(toDurationBucket(150)).toBe("100ms_300ms");
    expect(toDurationBucket(500)).toBe("300ms_1s");
    expect(toDurationBucket(1500)).toBe("1s_3s");
    expect(toDurationBucket(5000)).toBe("3s_10s");
    expect(toDurationBucket(15000)).toBe("gte_10s");
  });

  it("handles bucket boundaries correctly", () => {
    expect(toDurationBucket(99)).toBe("lt_100ms");
    expect(toDurationBucket(100)).toBe("100ms_300ms");

    expect(toDurationBucket(299)).toBe("100ms_300ms");
    expect(toDurationBucket(300)).toBe("300ms_1s");

    expect(toDurationBucket(999)).toBe("300ms_1s");
    expect(toDurationBucket(1000)).toBe("1s_3s");

    expect(toDurationBucket(2999)).toBe("1s_3s");
    expect(toDurationBucket(3000)).toBe("3s_10s");

    expect(toDurationBucket(9999)).toBe("3s_10s");
    expect(toDurationBucket(10000)).toBe("gte_10s");
  });
});
