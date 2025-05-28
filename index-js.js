import {
    createWalletClient,
    custom,
    createPublicClient,
    parseEther, 
    formatEther,
    defineChain
} from "https://esm.sh/viem";
import {contractAddress, coffeeabi} from "./constants-js.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const ethAmountInput = document.getElementById("ethAmount");
const withdrawButtonInput = document.getElementById("withdrawButton");
const getFundButton = document.getElementById("getFund");

let walletClient;
let publicClient;

connectButton.onclick = connectWallet;
fundButton.onclick = sendFund;
balanceButton.onclick = getBalance;
withdrawButtonInput.onclick = withdraw;
getFundButton.onclick = getFund;


async function getFund(){
    if(typeof window.ethereum !== "undefined"){
        try{
            publicClient = createPublicClient({
                transport: custom(window.ethereum)
            })

            walletClient = createWalletClient({
                transport: custom(window.ethereum)
            });

            const [connectedAddress] = await walletClient.requestAddresses();
            // console.log(connectedAddress);
            const abi = coffeeabi;
            // console.log(abi);
            const functionName = "getAddressToAmountFunded";
            
            const data = await publicClient.readContract({
                address: contractAddress,
                abi,
                functionName,
                args: [connectedAddress]
            })

            console.log(`The fund in account ${connectedAddress} is:${data}`);
            
        }catch(error){
            console.error("Get Fund Failed:", error);
            alert(`Get Fund Failed: ${error.message || error}`);
        }
    }else{
        connectButton.innerHTML = "PLease Install Metamask";
    }
}

async function connectWallet() {
    // If metamask exist, connect
    if (typeof window.ethereum !== "undefined") {
        walletClient = createWalletClient({
            transport: custom(window.ethereum)
        });
        await walletClient.requestAddresses();
        connectButton.innerHTML = "Connected";
    } else {
        connectButton.innerHTML = "PLease Install Metamask";
    }
}

async function sendFund() {
    const ethAmount = ethAmountInput.value;
    console.log(`Funding with ${ethAmount}...`);

    // In case the user have not connect wallet to send fund
    if (typeof window.ethereum !== "undefined") {
        try{
            walletClient = createWalletClient({
                transport: custom(window.ethereum)
            });
            // requestAddresses returns an array of addresses
            const [connectedAddress] = await walletClient.requestAddresses();
            const currentChain = await getCurrentChain(walletClient);

            publicClient = createPublicClient({
                transport: custom(window.ethereum)
            });
            // This function simulate the transaction first with, if any revert happen,
            // It will not cost us gas for a revert amount and function call.
            const {request} = await publicClient.simulateContract({ // return specific field of request, no other fields stored
                address: contractAddress,
                abi: coffeeabi,
                functionName: "fund",
                account: connectedAddress,
                chain: currentChain,
                // value: ethAmount // This will be read as wei, which we want eth not wei
                value: parseEther(ethAmount)
            })
            console.log("Simulation:", request);
            console.log("Simulation Successful, transaction is likely to succeed");
            
            // This is to execute the transaction
            const hash = await walletClient.writeContract(request);
            console.log("Hash is:", hash);
        }
        catch(error){
            console.error("Simulation Failed:", error);
            alert(`Simulation Failed: ${error.message || error}`);
        }
    } else {
        connectButton.innerHTML = "PLease Install Metamask";
    }
}

async function withdraw(){
    if(typeof window.ethereum !== "undefined"){
        try{
            walletClient = createWalletClient({
                transport: custom(window.ethereum)
            });
            const [connectedAddress] = await walletClient.requestAddresses();
            const currentChain = await getCurrentChain(walletClient);

            const {request} = await publicClient.simulateContract({
                address: contractAddress,
                abi: coffeeabi,
                functionName: "withdraw",
                account: connectedAddress,
                chain: currentChain,
            });

            const hash = await walletClient.writeContract(request);
            console.log("Withdrawal Succeed! And Here is the Hash:", hash);
        }
        catch(error){
            console.error("Withdrawal Failed:", error);
            alert(`Withdrawal Failed: ${error.message || error}`);
        }
    }else{
        connectButton.innerHTML = "PLease Install Metamask";
    }
}

async function getBalance(){
    if (typeof window.ethereum !== "undefined") {
        publicClient = createPublicClient({
            transport: custom(window.ethereum)
        });
        const balance = await publicClient.getBalance({
            address: contractAddress
        })
        console.log(`The Balance is:`, formatEther(balance)); //change wei to ETH
    } 
}

async function getCurrentChain(client) {
        const chainId = await client.getChainId()
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
        })
        return currentChain
}

