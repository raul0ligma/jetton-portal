import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { JettonHodler } from '../build/JettonHodler/JettonHodler_JettonHodler';
import '@ton/test-utils';

describe('JettonHodler', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonHodler: SandboxContract<JettonHodler>;

    beforeEach(async () => {});

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonHodler are ready to use
    });

    it('should increase counter', async () => {});
});
