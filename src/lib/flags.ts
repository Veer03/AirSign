export const flags = {
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "1",
  landing3d: process.env.NEXT_PUBLIC_ENABLE_LANDING_3D === "1",
  teach: process.env.NEXT_PUBLIC_ENABLE_TEACH === "1",
  gist: process.env.NEXT_PUBLIC_ENABLE_GIST === "1",
} as const;
