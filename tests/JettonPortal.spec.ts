import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { JettonPortal } from '../build/JettonPortal/JettonPortal_JettonPortal';
import '@ton/test-utils';

describe('JettonPortal', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonPortal: SandboxContract<JettonPortal>;

    beforeEach(async () => {});

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonPortal are ready to use
    });

    it('should increase counter', async () => {});
});
