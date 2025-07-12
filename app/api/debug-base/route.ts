// /app/api/debug-base/route.ts (delete later)
export async function GET() {
  console.log('🔍 BASE_URL at runtime →', process.env.BASE_URL);
  return Response.json({ BASE_URL: process.env.BASE_URL });
}