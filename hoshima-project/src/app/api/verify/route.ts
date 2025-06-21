import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload;
    
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
      // This is where you should perform backend actions if the verification succeeds
      // Such as, setting a user as "verified" in a database
      console.log('Verification successful for action:', action);
      console.log('Nullifier hash:', payload.nullifier_hash);
      
      return NextResponse.json({ 
        verifyRes, 
        status: 200,
        message: 'Human verification successful'
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