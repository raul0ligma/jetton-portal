// scripts/deployJettonPortal.ts
import { Address, toNano, beginCell } from '@ton/core';
import { JettonPortal } from '../build/JettonPortal/JettonPortal_JettonPortal';
import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Deploying JettonPortal to Mainnet...\n');

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
    console.log('🔨 Deploying JettonPortal contract...');

    const jettonPortal = provider.open(
        await JettonPortal.fromInit(
            provider.sender().address!, // owner
            USDT_MASTER, // usdtAddress
            usdtJettonWalletCode, // usdtJettonWalletCode
        ),
    );

    console.log(`   Deployer: ${provider.sender().address}`);
    console.log(`   Contract will be deployed at: ${jettonPortal.address}`);

    // Step 3: Send deployment transaction
    await jettonPortal.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null, // Empty message for deployment
    );

    await provider.waitForDeploy(jettonPortal.address);

    console.log('✅ JettonPortal deployed successfully!\n');

    // Step 4: Get contract info
    console.log('📋 Contract Information:');
    console.log(`   📍 Contract Address: ${jettonPortal.address}`);

    const owner = await jettonPortal.getGetOwner();
    console.log(`   👤 Owner: ${owner}`);

    const contractUsdtWallet = await jettonPortal.getCalculateSelfUsdtWalletAddress();
    console.log(`   💳 Contract USDT Wallet: ${contractUsdtWallet}`);

    console.log('🎉 Deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log(`1. Update CONTRACT_ADDRESS in interaction script to: ${jettonPortal.address}`);
    console.log('2. Send USDT to the contract with custom payload to test');
    console.log('3. Use the interaction script to test functionality');

    return jettonPortal.address;
}
