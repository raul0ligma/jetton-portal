// scripts/deployJettonHodler.ts
import { Address, toNano, beginCell } from '@ton/core';
import { JettonHodler } from '../build/JettonHodler/JettonHodler_JettonHodler';
import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Deploying JettonHodler to Mainnet...\n');

    const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');

    // Step 1: Get real USDT jetton wallet code from mainnet
    console.log('📥 Fetching USDT jetton wallet code from mainnet...');

    let usdtJettonWalletCode;
    try {
        // Use provider.provider() to get the TonClient
        const usdtContract = provider.open(JettonMaster.create(USDT_MASTER));
        const jettonDataResult = await usdtContract.getJettonData();

        console.log(jettonDataResult);
        usdtJettonWalletCode = jettonDataResult.walletCode; // jetton_wallet_code

        console.log('✅ USDT jetton wallet code fetched successfully\n');
    } catch (error) {
        console.error('❌ Failed to fetch USDT jetton wallet code:', error);
        throw error;
    }

    // Step 2: Deploy contract using Blueprint's fromInit
    console.log('🔨 Deploying JettonHodler contract...');

    const jettonHodler = provider.open(
        await JettonHodler.fromInit(
            provider.sender().address!, // owner
            USDT_MASTER, // usdtAddress
            usdtJettonWalletCode, // usdtJettonWalletCode
        ),
    );

    console.log(`   Deployer: ${provider.sender().address}`);
    console.log(`   Contract will be deployed at: ${jettonHodler.address}`);

    // Step 3: Send deployment transaction
    await jettonHodler.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null, // Empty message for deployment
    );

    await provider.waitForDeploy(jettonHodler.address);

    console.log('✅ JettonHodler deployed successfully!\n');

    // Step 4: Get contract info
    console.log('📋 Contract Information:');
    console.log(`   📍 Contract Address: ${jettonHodler.address}`);

    const owner = await jettonHodler.getGetOwner();
    console.log(`   👤 Owner: ${owner}`);

    const contractUsdtWallet = await jettonHodler.getCalculateSelfUsdtWalletAddress();
    console.log(`   💳 Contract USDT Wallet: ${contractUsdtWallet}`);

    console.log('🎉 Deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log(`1. Update CONTRACT_ADDRESS in interaction script to: ${jettonHodler.address}`);
    console.log('2. Send USDT to the contract with custom payload to test');
    console.log('3. Use the interaction script to test functionality');

    return jettonHodler.address;
}
