require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

const config = require("./blockchain_config.json")[process.argv.length > 2 ? process.argv[2] : "GANACHE_LOCAL"];

const dirBuiltContracts = "../smart_contract/build/contracts/";
const fs = require("fs");
fs.writeFileSync(
    "public/contracts/ERC721.json",
    JSON.stringify(require(dirBuiltContracts + "ERC721.json").abi),
    "utf8"
);
fs.writeFileSync(
    "public/contracts/TRY.json",
    JSON.stringify(require(dirBuiltContracts + "TRY.json").abi),
    "utf8"
);
fs.writeFileSync(
    "public/contracts/Lottery_manager.json",
    JSON.stringify(require(dirBuiltContracts + "Lottery.json").abi.filter(v => v.stateMutability != "payable")),
    "utf8"
);
fs.writeFileSync(
    "public/contracts/Lottery_user.json",
    JSON.stringify(require(dirBuiltContracts + "Lottery.json").abi.filter(v => v.stateMutability != "nonpayable")),
    "utf8"
);

[
    "/public",
    "/node_modules/web3",
].map(fn => app.use(express.static(__dirname + fn)));

app.get("/api/contract_addresses", (req, res) => {
    res.send({
        ERC721: require(dirBuiltContracts + "ERC721.json").networks[config.CHAIN_ID].address,
        TRY: require(dirBuiltContracts + "TRY.json").networks[config.CHAIN_ID].address
    });
});

app.get("/api/web3storage_jwt", (req, res) => {
    res.send({ jwt: process.env.WEB3STORAGE_JWT });
});

app.get("/api/endpoint", (req, res) => {
    res.send(config.ENDPOINT);
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


