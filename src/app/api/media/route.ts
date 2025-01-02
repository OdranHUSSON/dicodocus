import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getPaths } from '@/config/docusaurus';

interface MediaItem {
  id: string;
  name: string;
  description: string;
  path: string;
  createdAt: string;
  size: number;
}

interface MediaLibrary {
  items: MediaItem[];
}

const { mediaDir } = getPaths();
const MEDIA_JSON = path.join(mediaDir, 'media.json');

// Function to convert absolute path to relative Docusaurus path
function toDocusaurusPath(absolutePath: string): string {
  const fileName = path.basename(absolutePath);
  return `/img/${fileName}`;
}

async function ensureMediaDirectory() {
  if (!existsSync(mediaDir)) {
    await mkdir(mediaDir, { recursive: true });
  }
}

async function getMediaLibrary(): Promise<MediaLibrary> {
  try {
    const content = await readFile(MEDIA_JSON, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { items: [] };
  }
}

async function saveMediaLibrary(library: MediaLibrary) {
  await writeFile(MEDIA_JSON, JSON.stringify(library, null, 2));
}

export async function GET() {
  try {
    const library = await getMediaLibrary();
    return NextResponse.json(library);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureMediaDirectory();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal and ensure URL-friendly names
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const fileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(mediaDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const library = await getMediaLibrary();
    const newItem: MediaItem = {
      id: Date.now().toString(),
      name: file.name,
      description,
      path: toDocusaurusPath(filePath), // Convert to Docusaurus path format
      createdAt: new Date().toISOString(),
      size: buffer.length,
    };

    library.items.push(newItem);
    await saveMediaLibrary(library);

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    const library = await getMediaLibrary();
    const item = library.items.find(item => item.id === id);
    
    if (!item) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Remove file from filesystem
    const fileName = item.path.split('/').pop();
    const filePath = path.join(mediaDir, fileName!);
    await unlink(filePath).catch(() => {
      // Ignore error if file doesn't exist
    });

    // Update media library
    library.items = library.items.filter(item => item.id !== id);
    await saveMediaLibrary(library);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}