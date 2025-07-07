import { NextRequest, NextResponse } from 'next/server';

// Endpoint temporaire pour tester le countdown jusqu'au redéploiement
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [TEST] Endpoint test-countdown appelé');
    
    // Calculer un compte à rebours de 7 jours à partir de maintenant
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const remaining = sevenDaysFromNow - now;
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const mockData = {
      days,
      hours,
      minutes,
      seconds,
      timeRemaining: remaining,
      isActive: true,
      endTime: sevenDaysFromNow,
      startTime: now,
      source: 'test-endpoint'
    };
    
    console.log('✅ [TEST] Données test générées:', mockData);
    
    return NextResponse.json(mockData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
    return NextResponse.json(
      { error: 'Test endpoint error', message: error instanceof Error ? error.message : 'Unknown error' },
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