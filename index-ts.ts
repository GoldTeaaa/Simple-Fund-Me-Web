import {
    createWalletClient,
    custom,
    createPublicClient,
    parseEther,
    formatEther,
    defineChain,
    WalletClient,
    PublicClient,
    SimulateContractReturnType,
    Chain
} from "viem";
import "viem/window";
import { contractAddress, abi } from "./constants-ts";

const connectButton = document.getElementById("connectButton") as HTMLButtonElement;
const fundButton = document.getElementById("fundButton") as HTMLButtonElement;
const balanceButton = document.getElementById("balanceButton") as HTMLButtonElement;
const ethAmountInput = document.getElementById("ethAmount") as HTMLInputElement;
const withdrawButtonInput = document.getElementById("withdrawButton") as HTMLButtonElement;

console.log("HI! From TypeScript");

let walletClient: WalletClient | undefined;
let publicClient: PublicClient | undefined;

connectButton.onclick = connectWallet;
fundButton.onclick = sendFund;
balanceButton.onclick = getBalance;
withdrawButtonInput.onclick = withdraw;

async function connectWallet(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
        walletClient = createWalletClient({
            transport: custom(window.ethereum)
        });
        await walletClient.requestAddresses();
        connectButton.innerHTML = "Connected";
    } else {
        connectButton.innerHTML = "Please Install Metamask";
    }
}

async function sendFund(): Promise<void> {
    const ethAmount = ethAmountInput.value;
    console.log(`Funding with ${ethAmount}...`);

    if (typeof window.ethereum !== "undefined") {
        try {
            walletClient = createWalletClient({
                transport: custom(window.ethereum)
            });

            const [connectedAddress] = await walletClient.requestAddresses();
            const currentChain = await getCurrentChain(walletClient);

            publicClient = createPublicClient({
                transport: custom(window.ethereum)
            });

            const { request }: SimulateContractReturnType = await publicClient.simulateContract({
                address: contractAddress,
                abi: abi,
                functionName: "fund",
                account: connectedAddress,
                chain: currentChain,
                value: parseEther(ethAmount)
            });

            console.log("Simulation:", request);
            console.log("Simulation Successful, transaction is likely to succeed");

            const hash = await walletClient.writeContract(request);
            console.log("Hash is:", hash);
        } catch (error: any) {
            console.error("Simulation Failed:", error);
            alert(`Simulation Failed: ${error.message || error}`);
        }
    } else {
        connectButton.innerHTML = "Please Install Metamask";
    }
}

async function withdraw(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
        try {
            walletClient = createWalletClient({
                transport: custom(window.ethereum)
            });
            const [connectedAddress] = await walletClient.requestAddresses();
            const currentChain = await getCurrentChain(walletClient);

            if (!publicClient) {
                publicClient = createPublicClient({
                    transport: custom(window.ethereum)
                });
            }

            const { request }: SimulateContractReturnType = await publicClient.simulateContract({
                address: contractAddress,
                abi: abi,
                functionName: "withdraw",
                account: connectedAddress,
                chain: currentChain
            });

            const hash = await walletClient.writeContract(request);
            console.log("Withdrawal Succeed! And Here is the Hash:", hash);
        } catch (error: any) {
            console.error("Withdrawal Failed:", error);
            alert(`Withdrawal Failed: ${error.message || error}`);
        }
    } else {
        connectButton.innerHTML = "Please Install Metamask";
    }
}

async function getBalance(): Promise<void> {
    if (typeof window.ethereum !== "undefined") {
        publicClient = createPublicClient({
            transport: custom(window.ethereum)
        });
        const balance = await publicClient.getBalance({
            address: contractAddress
        });
        console.log("The Balance is:", formatEther(balance));
    }
}

async function getCurrentChain(client: WalletClient): Promise<Chain> {
    const chainId = await client.getChainId();
    const currentChain = defineChain({
        id: chainId,
        name: "Custom Chain",
        nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: ["http://localhost:8545"],
            },
        },
    });
    return currentChain;
}
