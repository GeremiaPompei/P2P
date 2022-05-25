// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IERC721.sol';
import './IERC721Metadata.sol';
import './IERC721TokenReceiver.sol';

contract ERC721 is IERC721, IERC721Metadata {

    string private __name;
    string private __symbol;
    string private __baseURI;

    mapping(uint256 => address) private __owners;
    mapping(address => uint256) private __balances;
    mapping(uint256 => address) private __tokenApprovals;
    mapping(address => mapping(address => bool)) private __operatorApprovals;
    
    constructor(string memory _name, string memory _symbol, string memory _baseURI) {
        __name = _name;
        __symbol = _symbol;
        __baseURI = _baseURI;
    }

    function balanceOf(address _owner) override external view returns (uint256) {
        require(_owner != address(0), "Invalid owner address");
        return __balances[_owner];
    }

    function ownerOf(uint256 _tokenId) override external view returns (address) {
        address owner = __owners[_tokenId];
        require(owner != address(0), "Token does not exists");
        return owner;
    }

    modifier __isApprovedOrOwner(address spender, uint256 tokenId) {
        require(tokenId != 0, "Token does not exists");
        address owner = this.ownerOf(tokenId);
        require(spender == owner || __operatorApprovals[owner][spender] || this.getApproved(tokenId) == spender, "Spender unauthorized");
        _;
    }

    function __transferFrom(address _from, address _to, uint256 _tokenId) private __isApprovedOrOwner(_from, _tokenId) {
        __owners[_tokenId] = _to;
        __balances[_from] -= 1;
        __balances[_to] += 1;
        emit Transfer(_from, _to, _tokenId);
    }

    function __checkContract(address _from, address _to, uint256 _tokenId, bytes memory _data) private {
        if(msg.sender != tx.origin) {
            try IERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data) returns (bytes4 retval) {
                require(retval == IERC721TokenReceiver.onERC721Received.selector);
            } catch (bytes memory reason) {
                assembly { revert(add(32, reason), mload(reason)) }
            }
        }
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) override external {
        __transferFrom(_from, _to, _tokenId);
        __checkContract(_from, _to, _tokenId, _data);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) override external {
        this.safeTransferFrom(_from, _to, _tokenId);

    }

    function transferFrom(address _from, address _to, uint256 _tokenId) override external {
        __transferFrom(_from, _to, _tokenId);

    }

    function approve(address _approved, uint256 _tokenId) override external {
        __tokenApprovals[_tokenId] = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) override external {
        __operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId) override external view returns (address) {
        return __tokenApprovals[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) override external view returns (bool) {
       return __operatorApprovals[_owner][_operator];
    }

    function name() override external view returns (string memory _name) {
        return __name;
    }
    
    function symbol() override external view returns (string memory _symbol) {
        return __symbol;
    }
    
    function tokenURI(uint256 _tokenId) override external view returns (string memory) {
        require(__owners[_tokenId] != address(0), "Token does not exists");
        string memory baseURI = __baseURI;
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, __uintToString(_tokenId))) : "";
    }

    function __uintToString(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0)
            return "0";
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}