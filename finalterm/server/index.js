require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

[
    "/public", 
    "/node_modules/web3", 
].map(fn => app.use(express.static(__dirname+fn)));

app.get("/api/contract_addresses", (req, res) => res.send({
    ERC721: require("../smart_contract/build/contracts/ERC721.json").networks[5777].address,
    TRY: require("../smart_contract/build/contracts/TRY.json").networks[5777].address
}));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));