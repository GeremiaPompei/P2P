// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'contracts/ERC721.sol';

contract NFT is ERC721 {

    function balanceOf(address _owner) override external view returns (uint256) {

    }

    function ownerOf(uint256 _tokenId) override external view returns (address) {

    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata data) override external payable {

    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) override external payable {

    }

    function transferFrom(address _from, address _to, uint256 _tokenId) override external payable {

    }

    function approve(address _approved, uint256 _tokenId) override external payable {

    }

    function setApprovalForAll(address _operator, bool _approved) override external {

    }

    function getApproved(uint256 _tokenId) override external view returns (address) {
        
    }

    function isApprovedForAll(address _owner, address _operator) override external view returns (bool) {

    }
}