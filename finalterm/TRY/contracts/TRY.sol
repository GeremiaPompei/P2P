// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './ERC721.sol';

contract TRY {

    enum Classes {None, Class_1, Class_2, Class_3, Class_4, Class_5, Class_6, Class_7, Class_8}

    struct Collectible {
        uint256 tokenId;
        string uri;
        bool available;
    }

    uint8 private constant TOTAL_NUMBERS = 6;
    uint8 private constant POWERBALL_POSITION = 5;
    uint8 private constant DURATION = 10;
    uint8[2][TOTAL_NUMBERS] private RANGES = [[1, 69], [1, 69], [1, 69], [1, 69], [1, 69], [1, 26]];

    address private __erc721Address;
    bool private __roundActive;
    uint256 private __startRoundBlockNumber;
    address private __operator;
    uint16 private __k;
    uint256 private __ticketPrice;

    uint8[TOTAL_NUMBERS] private __winningNumbers;
    address[] private __players;
    Collectible[] private __collectibles;
    uint8[TOTAL_NUMBERS][] private __tickets;

    constructor(address _erc721Address, uint16 _k, uint256 _ticketPrice) {
        __operator = msg.sender;
        __erc721Address = _erc721Address;
        __k = _k + 1 % 256;
        __roundActive = true;
        __ticketPrice = _ticketPrice;
    }

    modifier __isOperator() {
        require(__operator == msg.sender, "Operation unauthorized");
        _;
    }

    modifier __isRoundActive() {
        require(__roundActive && block.number - __startRoundBlockNumber < DURATION, "Round is not active");
        _;
    }

    function startNewRound() external {
        require(!__roundActive, "Round is not finished");
        __roundActive = true;
        __startRoundBlockNumber = block.number;
    }

    function buy(uint8[TOTAL_NUMBERS] memory numbers) external payable __isRoundActive() {
        require(msg.value >= __ticketPrice, "Not enough ether");
        __players.push(msg.sender);
        __tickets.push(numbers);
        payable(msg.sender).transfer(msg.value - __ticketPrice);
    }

    function drawNumbers() external __isOperator() {
        uint256 number = __random();
        for(uint8 i = 0; i < TOTAL_NUMBERS; i++) {
            __winningNumbers[i] = uint8(number) % RANGES[i][1] + RANGES[i][0];
            number /= 100;
        }
    }

    function givePrizes() external __isOperator() {
        for(uint8 i = 0; i < __players.length; i++) {
            if(__matchClass(__tickets[i]) != Classes.None) {
                Collectible storage _collectibles = __collectibles[i];
                require(_collectibles.tokenId > 0, "Not enough prizes");
                if(_collectibles.available){
                    ERC721(__erc721Address).safeTransferFrom(address(this), __players[i], _collectibles.tokenId);
                    _collectibles.available = false;
                } else {
                    ERC721(__erc721Address).mint(__players[i], _collectibles.uri);
                }
            }
        }
        payable(__operator).transfer(address(this).balance);
        this.startNewRound();
    }

    function mint(string memory _uri) external __isOperator() {
        uint256 _tokenId = ERC721(__erc721Address).mint(address(this), _uri);
        if(__collectibles.length + 1 > uint8(Classes.Class_8))
            __collectibles.pop();
        __collectibles.push(Collectible(_tokenId, _uri, true));
    }

    function closeLottery() external __isOperator() {
        require(__roundActive, "Lottery already closed");
        __roundActive = false;
    }

    function __random() private view returns(uint256) {
        return uint256(keccak256(abi.encode(blockhash(block.number - __k))));
    }

    function __matchClass(uint8[TOTAL_NUMBERS] memory _ticket) private view returns(Classes class) {
        uint8 stdMatches = 0;
        for(uint8 i = 0; i < TOTAL_NUMBERS - 1; i++)
            if(_ticket[i] == __winningNumbers[i])
                stdMatches += 1;
        bool matchPowerball = _ticket[POWERBALL_POSITION] == __winningNumbers[POWERBALL_POSITION];
        if(stdMatches == 5 && matchPowerball)
            return Classes.Class_1;
        if(stdMatches == 5)
            return Classes.Class_2;
        if(stdMatches == 4 && matchPowerball)
            return Classes.Class_3;
        if(stdMatches == 4 || stdMatches == 3 && matchPowerball)
            return Classes.Class_4;
        if(stdMatches == 3 || stdMatches == 2 && matchPowerball)
            return Classes.Class_5;
        if(stdMatches == 2 || stdMatches == 1 && matchPowerball)
            return Classes.Class_6;
        if(stdMatches == 1)
            return Classes.Class_7;
        if(matchPowerball)
            return Classes.Class_8;
        return Classes.None;
    }

}