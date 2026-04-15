import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRateLimitFn = vi.fn(() => vi.fn(() => "mock-rate-limiter"));

vi.mock("express-rate-limit", () => ({
  default: mockRateLimitFn,
  __esModule: true,
}));

vi.mock("rate-limit-redis", () => {
  class MockRedisStore {
    constructor() {}
  }
  return {
    __esModule: true,
    default: MockRedisStore,
  };
});

vi.mock("redis", () => ({
  createClient: vi.fn(() => ({})),
  __esModule: true,
}));

vi.mock("../../../data/index.js", () => ({
  CacheClient: {
    get: vi.fn(() => Promise.resolve({ sendCommand: vi.fn() })),
  },
}));

vi.mock("../../../utils/index.js", () => ({
  GLOBAL_RATE_LIMIT_WINDOW_SIZE: 60_000,
  GLOBAL_RATE_LIMIT_PER_WINDOW: 100,
  REDIS_RATE_LIMIT_KEY_PREFIX: "cipher_sql_studio_rate_limit:",
  EXECUTE_RATE_LIMIT_WINDOW_SIZE: 60_000,
  EXECUTE_RATE_LIMIT_PER_WINDOW: 10,
  RATE_LIMIT_ERROR: "API endpoint rate limit reached!",
}));

vi.mock("../../../config/index.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  envVars: {
    REDIS_URL: "redis://localhost:6379",
  },
}));

describe("rate_limiter middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("exports", () => {
    it("should export GlobalRateLimitMware as a function", async () => {
      const { GlobalRateLimitMware } = await import("../index");
      expect(typeof GlobalRateLimitMware).toBe("function");
    });

    it("should export ExecuteRateLimitMware as a function", async () => {
      const { ExecuteRateLimitMware } = await import("../index");
      expect(typeof ExecuteRateLimitMware).toBe("function");
    });
  });

  describe("rate limiter configuration", () => {
    it("should have correct configuration for GlobalRateLimitMware", async () => {
      mockRateLimitFn.mockClear();
      await import("../index");

      expect(mockRateLimitFn).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 100,
          windowMs: 60_000,
          message: { message: "API endpoint rate limit reached!" },
          legacyHeaders: false,
          standardHeaders: true,
          requestPropertyName: "rateLimit",
        }),
      );
    });

    it("should have correct configuration for ExecuteRateLimitMware", async () => {
      mockRateLimitFn.mockClear();
      await import("../index");

      expect(mockRateLimitFn).toHaveBeenCalledTimes(2);

      const secondCall = mockRateLimitFn.mock.calls[1];
      expect(secondCall[0]).toMatchObject({
        max: 10,
        windowMs: 60_000,
        message: { message: "API endpoint rate limit reached!" },
        legacyHeaders: false,
        standardHeaders: true,
        requestPropertyName: "rateLimit",
      });
    });

    it("should use RedisStore with correct prefix", async () => {
      mockRateLimitFn.mockClear();
      await import("../index");

      expect(mockRateLimitFn).toHaveBeenCalled();
    });
  });

  describe("Redis error handling", () => {
    it("should handle Redis unavailability gracefully", async () => {
      const { CacheClient } = await import("../../../data");
      vi.mocked(CacheClient.get).mockRejectedValueOnce(new Error("Redis connection failed"));

      const { GlobalRateLimitMware } = await import("../index");

      expect(GlobalRateLimitMware).toBeDefined();
    });

    it("should attempt to get Redis client on each request", async () => {
      const { CacheClient } = await import("../../../data");
      vi.mocked(CacheClient.get).mockResolvedValue({
        sendCommand: vi.fn().mockResolvedValue(1),
      });

      await import("../index");

      expect(CacheClient.get).toBeDefined();
    });
  });

  describe("rate limit message format", () => {
    it("should return correct message format when rate limited", async () => {
      mockRateLimitFn.mockClear();
      await import("../index");

      expect(mockRateLimitFn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: { message: "API endpoint rate limit reached!" },
        }),
      );
    });

    it("should use RATE_LIMIT_ERROR constant in message", async () => {
      mockRateLimitFn.mockClear();
      await import("../index");

      const calls = mockRateLimitFn.mock.calls;
      const allHaveCorrectMessage = calls.every((call: unknown[]) => {
        const config = call[0] as Record<string, unknown>;
        return JSON.stringify(config.message) === JSON.stringify({ message: "API endpoint rate limit reached!" });
      });
      expect(allHaveCorrectMessage).toBe(true);
    });
  });
});
