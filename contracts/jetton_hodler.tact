import "@stdlib/deploy";

struct OrderStorage {
    user: Address;
    orderId: Int as uint32;
    releaseAfter: Int as uint64;
}

message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64 = 0;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell? = null;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

const JettonTransferGas: Int = ton("0.05");

struct JettonWalletData {
    status: Int as uint4;
    balance: Int as coins;
    ownerAddress: Address;
    jettonMasterAddress: Address;
}

message(0xfc8f86e0) RefundMessage {
    amt: Int as coins;
}

fun calculateJettonWalletAddress(
    ownerAddress: Address,
    jettonMasterAddress: Address,
    jettonWalletCode: Cell,
): Address {
    let initData = JettonWalletData {
        status: 0,
        balance: 0,
        ownerAddress,
        jettonMasterAddress,
    };

    return contractAddress(StateInit {
        code: jettonWalletCode,
        data: initData.toCell(),
    });
}

contract JettonHodler with Deployable {
    orders: map<Int, OrderStorage>;
    owner: Address;
    usdtAddress: Address;
    usdtJettonWalletCode: Cell;
    selfJettonWallet: Address;

    init(owner: Address, usdtAddress: Address, usdtJettonWalletCode: Cell) {
        self.orders = emptyMap();
        self.owner = owner;
        self.usdtAddress = usdtAddress;
        self.usdtJettonWalletCode = usdtJettonWalletCode;
        self.selfJettonWallet = calculateJettonWalletAddress(myAddress(), self.usdtAddress, self.usdtJettonWalletCode);
    }

    get fun calculateSelfUSDTWalletAddress(): Address {
        return calculateJettonWalletAddress(myAddress(), self.usdtAddress, self.usdtJettonWalletCode);
    }

    receive() {
        cashback(sender());
    }

    receive(transfer: JettonTransferNotification) {
        require(sender() == self.selfJettonWallet, "only jetton wallet");

        let orderData: OrderStorage = OrderStorage {
            user: transfer.sender,
            orderId: 0,
            releaseAfter: now(),
        };

        if (!transfer.forwardPayload.empty()) {
            let forwardPayload: Slice = transfer.forwardPayload;
            let customPayloadCell: Cell = forwardPayload.loadRef(); // Load the reference
            let out: Slice = customPayloadCell.beginParse();
            orderData.user = out.loadAddress();
            orderData.orderId = out.loadUint(32);
            orderData.releaseAfter = out.loadUint(64);
        }

        self.orders.set(0, orderData);
        send(SendParameters {
            to: transfer.sender,
            value: 0,
            mode: SendRemainingValue,
        });
    }

    receive(msg: RefundMessage) {
        require(sender() == self.owner, "only owner");
        send(SendParameters {
            to: self.selfJettonWallet,
            value: JettonTransferGas,
            body: JettonTransfer {
                queryId: 0,
                amount: msg.amt,
                destination: self.owner,
                responseDestination: sender(),
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: beginCell()
                    .storeUint(0, 32)
                    .endCell()
                    .beginParse(),
            }.toCell(),
        });
        send(SendParameters {
            to: self.owner,
            value: 0,
            mode: SendRemainingValue,
        });
    }

    get fun getOwner(): Address {
        return self.owner;
    }

    get fun orderAddress(key: Int): Address? {
        let order = self.orders.get(key);
        if (order == null) {
            return null;
        }
        return order!!.user;
    }

    get fun orderId(key: Int): Int {
        let order = self.orders.get(key);
        if (order == null) {
            return 0;
        }
        return order!!.orderId;
    }

    get fun orderReleaseAfter(key: Int): Int {
        let order = self.orders.get(key);
        if (order == null) {
            return 0;
        }
        return order!!.releaseAfter;
    }

    receive("withdraw_all") {
        require(sender() == self.owner, "only owner");
        send(SendParameters {
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance,
        });
    }
}
