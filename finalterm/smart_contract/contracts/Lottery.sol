// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './ERC721.sol';

contract Lottery {

    enum Classes {None, Class_1, Class_2, Class_3, Class_4, Class_5, Class_6, Class_7, Class_8}

    struct Collectible {
        uint256 tokenId;
        string uri;
        bool available;
    }

    uint8 public constant TOTAL_NUMBERS = 6;
    uint8 public constant POWERBALL_POSITION = 5;
    uint8[2][TOTAL_NUMBERS] public RANGES = [[1, 69], [1, 69], [1, 69], [1, 69], [1, 69], [1, 26]];

    uint256 private __startRoundBlockNumber;
    address private __operator;
    uint16 private __k;
    address public erc721Address;
    bool public lotteryOpen;
    uint256 public ticketPrice;
    uint8 public duration;
    uint256 public round;

    uint8[TOTAL_NUMBERS] private __winningNumbers;
    address[] private __players;
    uint8[TOTAL_NUMBERS][] private __tickets;
    Collectible[] private __collectibles;

    constructor(address _erc721Address, uint8 _duration, uint16 _k, uint256 _ticketPrice) {
        __operator = tx.origin;
        erc721Address = _erc721Address;
        __k = _k + 1 % 256;
        lotteryOpen = true;
        __startRoundBlockNumber = block.number;
        ticketPrice = _ticketPrice;
        duration = _duration;
        round = 1;
        emit StartNewRound(__startRoundBlockNumber, round);
    }

    event StartNewRound(uint256 indexed _blockNumber, uint256 _round);
    event Buy(address indexed _player);
    event DrawNumbers();
    event NoGivePrize(address indexed _player, uint256 _round);
    event GivePrize(address indexed _player, uint256 _round, Classes indexed _class, uint256 indexed _tokenId);
    event CloseLottery();

    modifier __isOperator() {
        require(__operator == msg.sender, "Operation unauthorized");
        _;
    }

    modifier __isRoundActive() {
        require(isRoundActive(), "Round is not active");
        _;
    }

    function isRoundActive() public view returns(bool) {
        return block.number - __startRoundBlockNumber < duration;
    }

    function startNewRound() external {
        require(!isRoundActive(), "Round is not finished");
        __startRoundBlockNumber = block.number;
        round += 1;
        emit StartNewRound(__startRoundBlockNumber, round);
    }

    function buy(uint8[TOTAL_NUMBERS] memory numbers) external payable __isRoundActive() {
        require(lotteryOpen, "Lottery is closed");
        require(msg.value >= ticketPrice, "Not enough ether");
        address player = msg.sender;
        __players.push(player);
        __tickets.push(numbers);
        payable(player).transfer(msg.value - ticketPrice);
        emit Buy(player);
    }

    function drawNumbers() external __isOperator() {
        uint256 number = __random();
        for(uint8 i = 0; i < TOTAL_NUMBERS; i++) {
            __winningNumbers[i] = uint8(number) % RANGES[i][1] + RANGES[i][0];
            number /= 100;
        }
        emit DrawNumbers();
    }

    function givePrizes() external __isOperator() {
        require(!isRoundActive(), "Round is active");
        for(uint8 i = 0; i < __players.length; i++) {
            Classes class = __matchClass(__tickets[i]);
            address _player = __players[i];
            if(class != Classes.None) {
                Collectible storage _collectible = __collectibles[i];
                require(_collectible.tokenId > 0, "Not enough prizes");
                if(_collectible.available){
                    ERC721(erc721Address).safeTransferFrom(address(this), _player, _collectible.tokenId);
                    _collectible.available = false;
                } else {
                    ERC721(erc721Address).mint(_player, _collectible.uri);
                }
                emit GivePrize(_player, round, class, _collectible.tokenId);
            } else {
                emit NoGivePrize(_player, round);
            }
            delete __players[i];
            delete __tickets[i];
        }
        payable(__operator).transfer(address(this).balance);
    }

    function mint(string memory _uri) external __isOperator() {
        uint256 _tokenId = ERC721(erc721Address).mint(address(this), _uri);
        if(__collectibles.length + 1 > uint8(Classes.Class_8))
            __collectibles.pop();
        __collectibles.push(Collectible(_tokenId, _uri, true));
    }

    function closeLottery() external __isOperator() {
        require(lotteryOpen, "Lottery already closed");
        if(isRoundActive()) 
            for(uint8 i = 0; i < __players.length; i++) 
                payable(__players[i]).transfer(ticketPrice);
        lotteryOpen = false;
        emit CloseLottery();
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