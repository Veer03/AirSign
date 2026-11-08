export const flags = {
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== "0",
  landing3d: process.env.NEXT_PUBLIC_ENABLE_LANDING_3D !== "0",
  gist: process.env.NEXT_PUBLIC_ENABLE_GIST !== "0",
  stillFrame: process.env.NEXT_PUBLIC_ENABLE_STILL_FRAME === "1",
  n8n: process.env.NEXT_PUBLIC_ENABLE_N8N === "1",
  scribe: process.env.NEXT_PUBLIC_ENABLE_SCRIBE === "1",
} as const;
