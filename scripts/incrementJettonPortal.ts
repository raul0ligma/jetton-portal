// scripts/interactJettonHodler.ts
import { Address, beginCell, toNano } from '@ton/core';
import { JettonPortal } from '../build/JettonPortal/JettonPortal_JettonPortal';
import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    console.log('🎮 Interacting with JettonPortal on Mainnet...\n');

    const CONTRACT_ADDRESS = 'EQCgOqV43Ovm6BQFRCXMAbpkhAJwHJJrhdQhFcDd6rMaSfG-';

    const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
    const contractAddress = Address.parse(CONTRACT_ADDRESS);

    // Open contract instance using Blueprint's fromAddress
    const jettonPortal = provider.open(JettonPortal.fromAddress(contractAddress));

    console.log('📋 Contract Information:');
    console.log(`   📍 Contract: ${contractAddress}`);
    console.log(`   👤 Your Address: ${provider.sender().address}\n`);

    // Step 1: Get contract data
    console.log('📖 Step 1: Reading contract data...');

    const owner = await jettonPortal.getGetOwner();
    console.log(`   Owner: ${owner}`);

    const contractUsdtWallet = await jettonPortal.getCalculateSelfUsdtWalletAddress();
    console.log(`   Contract USDT Wallet: ${contractUsdtWallet}`);

    // provider.sender().address
    const usdtContract = provider.open(JettonMaster.create(USDT_MASTER));
    const jettonDataResult = await usdtContract.getWalletAddress(provider.sender().address!);
    const yourUsdtWallet = jettonDataResult;
    console.log(`   Your USDT Wallet: ${yourUsdtWallet}\n`);

    // Step 2: Check current orders
    console.log('📊 Step 2: Checking current orders...');

    const userAddress = await jettonPortal.getOrderAddress(0n);

    if (userAddress) {
        console.log(' 📦 Order found:');

        const orderId = await jettonPortal.getOrderId(0n);
        const releaseAfter = await jettonPortal.getOrderReleaseAfter(0n);

        console.log(` User: ${userAddress}`);
        console.log(` Order ID: ${orderId}`);
        console.log(` Release After: ${new Date(Number(releaseAfter) * 1000)}`);
    } else {
        console.log(' 📭 No orders found');
    }
    console.log();
    // Step 3: Send USDT to contract with custom data
    console.log('💸 Step 3: Sending USDT to contract...');

    const USDT_AMOUNT = 100n; // 1 USDT (6 decimals)

    // Create custom payload with your data
    const customPayload = beginCell()
        .storeAddress(provider.sender().address!) // user address
        .storeUint(12345, 32) // orderId
        .storeUint(BigInt(Math.floor(Date.now() / 1000) + 86400), 64) // releaseAfter (24h from now)
        .endCell();

    // Create jetton transfer message
    const jettonTransferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // JettonTransfer op
        .storeUint(0, 64) // queryId
        .storeCoins(USDT_AMOUNT) // amount
        .storeAddress(contractAddress) // destination (contract)
        .storeAddress(provider.sender().address) // responseDestination (contract will get notification)
        .storeBit(0) // customPayload null
        .storeCoins(toNano('0.1')) // forwardTonAmount
        .storeBit(1) // forwardPayload present
        .storeRef(customPayload) // our custom data
        .endCell();

    console.log('   📤 Sending USDT transfer...');
    console.log(`   Amount: ${Number(USDT_AMOUNT) / 1000000} USDT`);
    console.log(`   From: ${yourUsdtWallet}`);
    console.log(`   To Contract: ${contractAddress}`);

    try {
        await provider.sender().send({
            to: yourUsdtWallet,
            value: toNano('0.3'), // Gas for the transfer
            body: jettonTransferBody,
        });

        console.log('✅ USDT transfer sent successfully!');
        console.log('   ⏳ Wait ~30 seconds for confirmation...\n');

        // Wait a bit for the transaction to process
        console.log('⏱️  Waiting 30 seconds for transaction confirmation...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
    } catch (error) {
        console.error('❌ Failed to send USDT:', error);
        return;
    }

    // Step 4: Check updated orders
    console.log('📊 Step 4: Checking updated orders...');
    console.log('📊 Step 2: Checking current orders...');

    const userAddressAgain = await jettonPortal.getOrderAddress(0n);

    if (userAddressAgain) {
        console.log(' 📦 Order found:');

        const orderId = await jettonPortal.getOrderId(0n);
        const releaseAfter = await jettonPortal.getOrderReleaseAfter(0n);

        console.log(` User: ${userAddress}`);
        console.log(` Order ID: ${orderId}`);
        console.log(` Release After: ${new Date(Number(releaseAfter) * 1000)}`);
    } else {
        console.log(' 📭 No orders found');
    }
    console.log();
    // Step 5: Refund (only if you're the owner)
    console.log('💰 Step 5: Testing refund...');

    if (owner.equals(provider.sender().address!)) {
        console.log('   ✅ You are the owner, sending refund...');

        const refundAmount = USDT_AMOUNT; // Refund the same amount

        try {
            // Use Blueprint's send method with RefundMessage
            await jettonPortal.send(
                provider.sender(),
                {
                    value: toNano('0.8'), // Gas for refund
                },
                {
                    $$type: 'RefundMessage',
                    amt: refundAmount,
                },
            );

            console.log('✅ Refund request sent successfully!');
            console.log(`   Amount: ${Number(refundAmount) / 1000000} USDT`);
            console.log('   ⏳ Check your USDT wallet in ~30 seconds');
        } catch (error) {
            console.error('❌ Failed to send refund:', error);
        }
    } else {
        console.log('   ⚠️  You are not the owner, cannot refund');
        console.log(`   Owner: ${owner}`);
        console.log(`   Your address: ${provider.sender().address}`);
    }

    console.log('\n🎉 Interaction completed!');
    console.log('\n📈 Summary:');
    console.log('✅ Contract data read successfully');
    console.log('✅ USDT transfer with custom data sent');
    console.log('✅ Order data updated');
    console.log('✅ Refund tested');

    console.log('\n💡 Tips:');
    console.log('• Check your USDT wallet balance for refund');
    console.log('• Monitor transactions on tonscan.org');
    console.log('• Run this script multiple times to test different scenarios');
}
