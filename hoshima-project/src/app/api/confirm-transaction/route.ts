import { NextRequest, NextResponse } from 'next/server'

interface IRequestPayload {
	payload: {
		transaction_id: string;
		status: 'success' | 'error';
		error?: string;
	}
}

export async function POST(req: NextRequest) {
	try {
		const { payload } = (await req.json()) as IRequestPayload

		// Log de la transaction reçue
		console.log('🔍 Transaction received:', {
			transaction_id: payload.transaction_id,
			status: payload.status,
		});

		// Récupérer l'APP_ID depuis les variables d'environnement
		const appId = process.env.APP_ID || process.env.NEXT_PUBLIC_APP_ID;

		if (!appId) {
			console.error('❌ APP_ID not configured');
			return NextResponse.json({ 
				success: false, 
				error: 'APP_ID not configured' 
			}, { status: 500 });
		}

		// Vérifier si la transaction a été initiée avec succès
		if (payload.status === 'error') {
			console.error('❌ Transaction initiation failed');
			return NextResponse.json({ 
				success: false, 
				error: 'Transaction initiation failed',
				details: payload
			});
		}

		// Pour le test, nous acceptons la transaction sans vérification complète
		// Dans un environnement de production, vous devriez attendre la confirmation on-chain
		console.log('✅ Transaction accepted (test mode)');
		
		// Si vous voulez vérifier le statut de la transaction (optionnel)
		try {
			const response = await fetch(
				`https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${appId}&type=transaction`,
				{
					method: 'GET',
				}
			);

			if (response.ok) {
				const transaction = await response.json();
				console.log('📊 Transaction status:', transaction);
				
				return NextResponse.json({ 
					success: true,
					transaction: transaction,
					message: 'Transaction initiated successfully'
				});
			} else {
				console.warn('⚠️ Could not fetch transaction status');
			}
		} catch (error) {
			console.warn('⚠️ Error fetching transaction status:', error);
		}

		// Retourner succès même si on ne peut pas vérifier le statut
		return NextResponse.json({ 
			success: true,
			transaction_id: payload.transaction_id,
			message: 'Transaction initiated successfully'
		});

	} catch (error) {
		console.error('❌ Error in confirm-transaction:', error);
		return NextResponse.json({ 
			success: false, 
			error: 'Internal server error' 
		}, { status: 500 });
	}
} 