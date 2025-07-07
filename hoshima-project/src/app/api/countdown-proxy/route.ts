import { NextRequest, NextResponse } from 'next/server';

// Proxy pour contourner les problèmes CORS sur mobile
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [PROXY] Countdown proxy appelé depuis:', request.headers.get('referer') || 'unknown');
    console.log('🔄 [PROXY] URL appelée:', request.url);
    console.log('🔄 [PROXY] Method:', request.method);
    
    const backendUrl = 'https://k-a-e-l-e-n.onrender.com/api/countdown';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Proxy/1.0'
      },
      cache: 'no-store'  // Pas de cache pour avoir les données en temps réel
    });

    if (!response.ok) {
      console.error('❌ Erreur backend:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Données récupérées du backend:', data);

    // Retourner les données avec les headers CORS appropriés
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (error) {
    console.error('❌ Erreur proxy countdown:', error);
    return NextResponse.json(
      { 
        error: 'Proxy error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxy countdown reset appelé');
    
    const backendUrl = 'https://k-a-e-l-e-n.onrender.com/api/countdown/reset';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-Proxy/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Reset réussi via proxy:', data);

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('❌ Erreur proxy reset:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}