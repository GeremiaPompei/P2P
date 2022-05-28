const ERC721 = artifacts.require("ERC721");
const TRY = artifacts.require("TRY");

module.exports = async function (deployer) {
    await deployer.deploy(ERC721, "NFT_TRY", "NFTRY", "");
    await deployer.deploy(TRY, ERC721.address);
};
