require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

[
    "/public", 
    "/node_modules/@truffle/contract", 
    "/node_modules/web3", 
].map(fn => app.use(express.static(__dirname+fn)));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));