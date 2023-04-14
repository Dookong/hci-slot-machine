require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  compilers: {
    solc: {
        version: "0.8.19"  
    }
  },
  networks: {  
    development: {  
      host: "localhost",  
      port: 8545,  
      network_id: "*"  
    },
    sepolia: {
      provider: function() {
        return new HDWalletProvider(`${MNEMONIC}`,`${API_URL}`, 0);
      },
      network_id: 11155111,
      gasPrice: 53000000000,
    }  
  }  
};
