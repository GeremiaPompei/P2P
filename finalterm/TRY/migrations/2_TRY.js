const NFT = artifacts.require("NFT");
const TRY = artifacts.require("TRY");

module.exports = function (deployer) {
    deployer.deploy(NFT);
    deployer.deploy(TRY);
};
