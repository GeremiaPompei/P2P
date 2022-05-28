// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './Lottery.sol';

contract TRY {

    address public erc721Address;

    constructor(address _erc721Address) {
        erc721Address = _erc721Address;
    }

    event LotteryCreated(address _owner, address _addressLottery);

    function createLottery(uint8 _duration, uint16 _k, uint256 _ticketPrice) external returns(address) {
        Lottery lottery = new Lottery(erc721Address, _duration, _k, _ticketPrice);
        address _addressLottery = address(lottery);
        emit LotteryCreated(msg.sender, _addressLottery);
        return _addressLottery;
    }
}