const ERC721 = artifacts.require("ERC721");
const Lottery = artifacts.require("Lottery");
const TRY = artifacts.require("TRY");

module.exports = async function (deployer) {
    await deployer.deploy(ERC721, "NFT_TRY", "NFTRY", "");
    await deployer.deploy(TRY, ERC721.address);
    // Lottery for tests
    await deployer.deploy(Lottery, ERC721.address, 3, 3, 3);
};
