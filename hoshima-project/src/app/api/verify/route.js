// const { NextRequest, NextResponse } = require('next/server');
// const { verifyCloudProof } = require('@worldcoin/minikit-js');
// const UserService = require('../../../../../backend/services/userService');

// async function POST(req) {
//   try {
//     const { payload, action, signal } = await req.json();

//     if (!payload || !action || !signal) {
//       return NextResponse.json({ 
//         error: 'Missing required fields',
//         status: 400 
//       });
//     }

//     const app_id = process.env.APP_ID;
//     if (!app_id) {
//       console.error('APP_ID environment variable is not set');
//       return NextResponse.json({ 
//         error: 'Server configuration error',
//         status: 500 
//       });
//     }

//     const verifyRes = await verifyCloudProof(
//       payload, 
//       app_id, 
//       action, 
//       signal
//     );

//     if (verifyRes.success) {
//       const user = await UserService.findOrCreateUser(signal);

//       const twentyFourHours = 24 * 60 * 60 * 1000;
//       const lastClaimed = user.lastCruClaimedAt?.getTime() || 0;
//       const timeSinceLastClaim = Date.now() - lastClaimed;

//       if (timeSinceLastClaim < twentyFourHours) {
//         const remainingTime = twentyFourHours - timeSinceLastClaim;
//         const hours = Math.floor(remainingTime / (1000 * 60 * 60));
//         const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        
//         return NextResponse.json({
//           status: 400,
//           verifyRes: {
//             success: false,
//             detail: `Daily CRU already claimed. Try again in ${hours}h ${minutes}m.`
//           }
//         });
//       }

//       user.cruBalance = (user.cruBalance || 0) + 1;
//       user.lastCruClaimedAt = new Date();
//       await user.save();

//       return NextResponse.json({ 
//         verifyRes, 
//         status: 200,
//         message: 'Verification successful! +1 CRU claimed.'
//       });
//     } else {
//       console.error('Verification failed:', verifyRes);
      
//       return NextResponse.json({ 
//         verifyRes, 
//         status: 400,
//         message: 'Verification failed'
//       });
//     }
//   } catch (error) {
//     console.error('Error during verification:', error);
//     return NextResponse.json({ 
//       error: 'Internal server error',
//       status: 500 
//     });
//   }
// }

// module.exports = { POST };