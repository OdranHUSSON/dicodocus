import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    local: "stopped",
    production: "running"
  });
}
