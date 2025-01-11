import { NextResponse } from 'next/server';

async function checkServerStatus(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok ? 'running' : 'stopped';
  } catch (error) {
    return 'stopped';
  }
}

export async function GET() {
  const localStatus = await checkServerStatus(process.env.DOCUSAURUS_URL || '');
  const prodStatus = await checkServerStatus(process.env.DOCUSAURUS_PROD_URL || '');

  return NextResponse.json({
    local: localStatus,
    production: prodStatus
  });
}
