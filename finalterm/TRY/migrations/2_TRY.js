const ERC721 = artifacts.require("ERC721");
const TRY = artifacts.require("TRY");

module.exports = function (deployer) {
    deployer.deploy(ERC721);
    deployer.deploy(TRY);
};
