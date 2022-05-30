// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './ERC721.sol';

contract Lottery {

    enum Class {None, Class_1, Class_2, Class_3, Class_4, Class_5, Class_6, Class_7, Class_8}
    enum State {Buy, Draw, Prize, RoundFinished, Close}

    struct Collectible {
        uint256 tokenId;
        string uri;
        bool available;
    }

    uint8 public constant TOTAL_NUMBERS = 6;
    uint8 public constant POWERBALL_POSITION = 5;
    uint8[2][TOTAL_NUMBERS] public RANGES = [[1, 69], [1, 69], [1, 69], [1, 69], [1, 69], [1, 26]];

    address private __operator;
    uint16 private __k;
    address public erc721Address;
    uint256 public startRoundBlockNumber;
    State public state;
    uint256 public ticketPrice;
    uint8 public duration;
    uint256 public round;

    uint8[TOTAL_NUMBERS] private __winningNumbers;
    address[] private __players;
    uint8[TOTAL_NUMBERS][] private __tickets;
    mapping(Class => Collectible) public collectibles;

    constructor(address _erc721Address, uint8 _duration, uint16 _k, uint256 _ticketPrice) {
        __operator = tx.origin;
        erc721Address = _erc721Address;
        __k = _k;
        startRoundBlockNumber = block.number;
        ticketPrice = _ticketPrice;
        duration = _duration;
        round = 1;
        emit StartNewRound(startRoundBlockNumber, round);
    }

    event StartNewRound(uint256 _blockNumber, uint256 _round);
    event Buy(address _player);
    event DrawNumbers(uint8 _n1, uint8 _n2, uint8 _n3, uint8 _n4, uint8 _n5, uint8 _powerball);
    event NoGivePrize(address _player, uint256 _round);
    event GivePrize(address _player, uint256 _round, Class _class, uint256 _tokenId);
    event GiveBack(address _player, uint256 _value);
    event CloseLottery();
    event ChangeState(State _state);

    modifier __isOperator() {
        require(__operator == msg.sender, "Operation unauthorized");
        _;
    }

    function startNewRound() public {
        require(state == State.RoundFinished, "Round is not finished");
        startRoundBlockNumber = block.number;
        round += 1;
        state = State.Buy;
        emit StartNewRound(startRoundBlockNumber, round);
        emit ChangeState(state);
    }

    function buy(uint8[TOTAL_NUMBERS] memory numbers) public payable {
        require(state == State.Buy, "You cannot buy now");
        require(msg.value >= ticketPrice, "Not enough ether");
        bool canBuy = block.number - startRoundBlockNumber < duration;
        if(!canBuy) {
            state = State.Draw;
            emit ChangeState(state);
        } else {
            address player = msg.sender;
            __players.push(player);
            __tickets.push(numbers);
            payable(player).transfer(msg.value - ticketPrice);
            emit Buy(player);
        }
    }

    function drawNumbers() public __isOperator() {
        require(state == State.Draw, "You cannot draw now");
        uint256 number = __random();
        for(uint8 i = 0; i < TOTAL_NUMBERS; i++) {
            __winningNumbers[i] = uint8(number) % RANGES[i][1] + RANGES[i][0];
            number /= 100;
        }
        state = State.Prize;
        emit DrawNumbers(__winningNumbers[0], __winningNumbers[1], __winningNumbers[2], __winningNumbers[3], __winningNumbers[4], __winningNumbers[5]);
        emit ChangeState(state);
    }

    function givePrizes() public __isOperator() {
        require(state == State.Prize, "You cannot give prizes now");
        for(uint8 i = 0; i < __players.length; i++) {
            Class class = __matchClass(__tickets[i]);
            address _player = __players[i];
            if(class != Class.None) {
                Collectible storage _collectible = collectibles[class];
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
        }
        delete __players;
        delete __tickets;
        state = State.RoundFinished;
        payable(__operator).transfer(address(this).balance);
        emit ChangeState(state);
    }

    function mint(string memory _uri, Class _class) public __isOperator() {
        uint256 _tokenId = ERC721(erc721Address).mint(address(this), _uri);
        collectibles[_class] = Collectible(_tokenId, _uri, true);
    }

    function closeLottery() public __isOperator() {
        require(state != State.Close, "Lottery already closed");
        if(state != State.RoundFinished) {
            for(uint8 i = 0; i < __players.length; i++) {
                payable(__players[i]).transfer(ticketPrice);
                emit GiveBack(__players[i], ticketPrice);
            }
        }
        state = State.Close;
        emit CloseLottery();
        emit ChangeState(state);
    }

    function __random() private view returns(uint256) {
        uint256 blockNumber = startRoundBlockNumber + duration + __k;
        require(blockNumber <= block.number, "Block not yet generated");
        return uint256(keccak256(abi.encode(blockhash(blockNumber))));
    }

    function __matchClass(uint8[TOTAL_NUMBERS] memory _ticket) private view returns(Class class) {
        uint8 stdMatches = 0;
        for(uint8 i = 0; i < TOTAL_NUMBERS - 1; i++)
            if(_ticket[i] == __winningNumbers[i])
                stdMatches += 1;
        bool matchPowerball = _ticket[POWERBALL_POSITION] == __winningNumbers[POWERBALL_POSITION];
        if(stdMatches == 5 && matchPowerball)
            return Class.Class_1;
        if(stdMatches == 5)
            return Class.Class_2;
        if(stdMatches == 4 && matchPowerball)
            return Class.Class_3;
        if(stdMatches == 4 || stdMatches == 3 && matchPowerball)
            return Class.Class_4;
        if(stdMatches == 3 || stdMatches == 2 && matchPowerball)
            return Class.Class_5;
        if(stdMatches == 2 || stdMatches == 1 && matchPowerball)
            return Class.Class_6;
        if(stdMatches == 1)
            return Class.Class_7;
        if(matchPowerball)
            return Class.Class_8;
        return Class.None;
    }

}