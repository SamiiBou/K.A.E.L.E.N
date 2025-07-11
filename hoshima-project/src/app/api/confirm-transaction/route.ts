import { NextRequest, NextResponse } from 'next/server'

interface IRequestPayload {
	payload: {
		transaction_id: string;
		status: 'success' | 'error';
		error?: string;
		reference?: string;
	}
}

export async function POST(req: NextRequest) {
	try {
		const { payload } = (await req.json()) as IRequestPayload

		// Log de la transaction reçue
		console.log('🔍 [TRANSFER] Transaction received:', {
			transaction_id: payload.transaction_id,
			status: payload.status,
		});

		// Récupérer l'APP_ID depuis les variables d'environnement
		const appId = process.env.APP_ID || process.env.NEXT_PUBLIC_APP_ID;

		if (!appId) {
			console.error('❌ [TRANSFER] APP_ID not configured');
			return NextResponse.json({ 
				success: false, 
				error: 'APP_ID not configured' 
			}, { status: 500 });
		}

		// Vérifier si la transaction a été initiée avec succès
		if (payload.status === 'error') {
			console.error('❌ [TRANSFER] Transaction initiation failed');
			return NextResponse.json({ 
				success: false, 
				error: 'Transaction initiation failed',
				details: payload
			});
		}

		console.log('✅ [TRANSFER] Transaction accepted, now crediting user');

		// 🔑 CORRECTION DU BUG: Créditer l'utilisateur pour les transferts indonésiens
		// Nous devons appeler le backend pour accorder les crédits CRU
		try {
			const backendUrl = process.env.BACKEND_URL || 'https://k-a-e-l-e-n.onrender.com';
			console.log('🔄 [TRANSFER] Calling backend to credit user via:', `${backendUrl}/api/payments/confirm-transfer`);
			
			const backendResponse = await fetch(`${backendUrl}/api/payments/confirm-transfer`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					payload: {
						transaction_id: payload.transaction_id,
						status: payload.status
					}
				}),
			});

			if (backendResponse.ok) {
				const backendResult = await backendResponse.json();
				console.log('✅ [TRANSFER] Backend successfully credited user:', backendResult);
				
				return NextResponse.json({ 
					success: true,
					transaction_id: payload.transaction_id,
					message: 'Transfer confirmed and user credited'
				});
			} else {
				const errorData = await backendResponse.json();
				console.error('❌ [TRANSFER] Backend failed to credit user:', errorData);
				
				return NextResponse.json({ 
					success: false, 
					error: 'Failed to credit user account',
					details: errorData
				}, { status: 500 });
			}
		} catch (backendError) {
			console.error('❌ [TRANSFER] Error calling backend:', backendError);
			
			// Fallback: Retourner succès pour la transaction mais noter l'erreur de crédit
			return NextResponse.json({ 
				success: false, 
				error: 'Transaction succeeded but user crediting failed',
				transaction_id: payload.transaction_id
			}, { status: 500 });
		}

	} catch (error) {
		console.error('❌ [TRANSFER] Error in confirm-transaction:', error);
		return NextResponse.json({ 
			success: false, 
			error: 'Internal server error' 
		}, { status: 500 });
	}
} 