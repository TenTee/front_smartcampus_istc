import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestedUrl = request.nextUrl.searchParams.get('url');
  if (!requestedUrl) {
    return NextResponse.json({ detail: 'URL du fichier manquante.' }, { status: 400 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/';
  let fileUrl;
  try {
    fileUrl = new URL(requestedUrl, apiBaseUrl);
    const apiOrigin = new URL(apiBaseUrl).origin;
    if (fileUrl.origin !== apiOrigin || !fileUrl.pathname.startsWith('/media/')) {
      return NextResponse.json({ detail: 'URL de fichier non autorisée.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ detail: 'URL de fichier invalide.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(fileUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ detail: 'Fichier introuvable.' }, { status: upstream.status });
    }

    const filename = decodeURIComponent(fileUrl.pathname.split('/').pop() || 'emploi-du-temps')
      .replace(/[\r\n"\\]/g, '_');
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ detail: 'Impossible de récupérer le fichier.' }, { status: 502 });
  }
}
