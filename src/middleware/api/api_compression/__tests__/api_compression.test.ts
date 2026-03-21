import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCompression, COMPRESSION_MIDDLEWARE_LEVEL, COMPRESSION_MIDDLEWARE_THRESHOLD } = vi.hoisted(() => {
  return {
    mockCompression: vi.fn(() => vi.fn()),
    COMPRESSION_MIDDLEWARE_LEVEL: 6,
    COMPRESSION_MIDDLEWARE_THRESHOLD: 1024,
  };
});

vi.mock("compression", () => ({
  default: mockCompression,
}));

vi.mock("../../../utils", () => ({
  COMPRESSION_MIDDLEWARE_LEVEL,
  COMPRESSION_MIDDLEWARE_THRESHOLD,
}));

describe("api_compression middleware", () => {
  let apiCompression: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import("../index");
    apiCompression = mod.default;
  });

  it("should export a function (default export)", () => {
    expect(apiCompression).toBeDefined();
    expect(typeof apiCompression).toBe("function");
  });

  it("should be configured with the correct level from constants", () => {
    expect(mockCompression).toHaveBeenCalledWith({
      level: COMPRESSION_MIDDLEWARE_LEVEL,
      threshold: COMPRESSION_MIDDLEWARE_THRESHOLD,
    });
  });

  it("should be configured with the correct threshold from constants", () => {
    expect(mockCompression).toHaveBeenCalledWith({
      level: COMPRESSION_MIDDLEWARE_LEVEL,
      threshold: COMPRESSION_MIDDLEWARE_THRESHOLD,
    });
  });

  it("should call compression with proper options", () => {
    expect(mockCompression).toHaveBeenCalledTimes(1);
    expect(mockCompression).toHaveBeenCalledWith({
      level: COMPRESSION_MIDDLEWARE_LEVEL,
      threshold: COMPRESSION_MIDDLEWARE_THRESHOLD,
    });
  });
});
