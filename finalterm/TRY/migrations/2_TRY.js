const ERC721 = artifacts.require("ERC721");
const TRY = artifacts.require("TRY");

module.exports = function (deployer) {
    deployer.deploy(ERC721, "NFT_TRY", "NFTRY", "").then(() => deployer.deploy(TRY, ERC721.address, 10, 3, 100));
};
