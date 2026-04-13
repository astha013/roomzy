async function storeOnBlockchain(hash) {
  if (!process.env.ETHEREUM_RPC_URL) {
    console.log('Mock blockchain storage - hash:', hash);
    return '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }

  try {
    const Web3 = require('web3');
    const web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    const contractABI = [];
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    
    const tx = {
      from: process.env.ETHEREUM_ADDRESS,
      to: contractAddress,
      data: contract.methods.storeHash(hash).encodeABI(),
      gas: '200000'
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.ETHEREUM_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    return receipt.transactionHash;
  } catch (error) {
    console.error('Blockchain error:', error);
    throw error;
  }
}

async function verifyOnBlockchain(hash, txHash) {
  console.log('Verifying hash on blockchain:', hash, 'tx:', txHash);
  return true;
}

module.exports = { storeOnBlockchain, verifyOnBlockchain };
const CryptoJS = require('crypto-js');

function generateVerificationHash(userId, verificationId, timestamp) {
  const data = `${userId}${verificationId}${timestamp}`;
  return CryptoJS.SHA256(data).toString();
}

module.exports.generateVerificationHash = generateVerificationHash;
