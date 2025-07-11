import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
  userId?: string; // Ajout du userId pour la récompense ECHO
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal, userId } = (await req.json()) as IRequestPayload;
    
    // Validate required fields
    if (!payload || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        status: 400 
      });
    }

    // Get the app_id from environment variables
    const app_id = process.env.APP_ID as `app_${string}`;
    
    if (!app_id) {
      console.error('APP_ID environment variable is not set');
      return NextResponse.json({ 
        error: 'Server configuration error',
        status: 500 
      });
    }

    // Verify the proof using World ID's cloud verification
    const verifyRes = (await verifyCloudProof(
      payload, 
      app_id, 
      action, 
      signal
    )) as IVerifyResponse;

    if (verifyRes.success) {
      console.log('Verification successful for action:', action);
      console.log('Nullifier hash:', payload.nullifier_hash);
      
      // Si un userId est fourni, donner la récompense ECHO
      let echoReward = null;
      if (userId) {
        try {
          // Appeler le service ECHO via l'API backend
          const echoResponse = await fetch(`${process.env.BACKEND_URL || 'https://k-a-e-l-e-n.onrender.com'}/api/world-id-verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          if (echoResponse.ok) {
            echoReward = await echoResponse.json();
            console.log('✅ Récompense ECHO World ID:', echoReward);
          } else {
            const errorData = await echoResponse.json();
            console.log('⚠️ Récompense ECHO déjà réclamée ou erreur:', errorData);
            echoReward = errorData;
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'attribution de la récompense ECHO:', error);
        }
      }
      
      return NextResponse.json({ 
        verifyRes, 
        status: 200,
        message: 'Human verification successful',
        echoReward: echoReward
      });
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      console.error('Verification failed:', verifyRes);
      
      return NextResponse.json({ 
        verifyRes, 
        status: 400,
        message: 'Verification failed'
      });
    }
  } catch (error) {
    console.error('Error during verification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      status: 500 
    });
  }
}