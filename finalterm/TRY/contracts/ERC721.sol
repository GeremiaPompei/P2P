// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IERC721.sol';
import './IERC721Metadata.sol';
import './IERC721TokenReceiver.sol';

contract ERC721 is IERC721, IERC721Metadata {

    string private __name;
    string private __symbol;
    string private __baseURI;
    uint256 private __counter = 0;

    mapping(uint256 => string) private __tokens;
    mapping(uint256 => address) private __owners;
    mapping(address => uint256) private __balances;
    mapping(uint256 => address) private __tokenApprovals;
    mapping(address => mapping(address => bool)) private __operatorApprovals;
    
    constructor(string memory _name, string memory _symbol, string memory _baseURI) {
        __name = _name;
        __symbol = _symbol;
        __baseURI = _baseURI;
    }

    modifier __isApprovedOrOwner(address _from, uint256 _tokenId) {
        require(_tokenId != 0, "Token does not exists");
        address owner = this.ownerOf(_tokenId);
        require(_from == owner, "Owner does not own the token");
        address spender = msg.sender;
        require(spender == owner || __operatorApprovals[owner][spender] || this.getApproved(_tokenId) == spender, "Spender unauthorized");
        _;
    }

    function balanceOf(address _owner) override virtual external view returns (uint256) {
        require(_owner != address(0), "Invalid owner address");
        return __balances[_owner];
    }

    function ownerOf(uint256 _tokenId) override virtual external view returns (address) {
        address owner = __owners[_tokenId];
        require(owner != address(0), "Token does not exists");
        return owner;
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) override virtual external {
        __transferFrom(_from, _to, _tokenId);
        __checkContract(_from, _to, _tokenId, _data);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) override virtual external {
        this.safeTransferFrom(_from, _to, _tokenId);

    }

    function transferFrom(address _from, address _to, uint256 _tokenId) override virtual external {
        __transferFrom(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId) override virtual external {
        __tokenApprovals[_tokenId] = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) override virtual external {
        __operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId) override virtual external view returns (address) {
        return __tokenApprovals[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator) override virtual external view returns (bool) {
       return __operatorApprovals[_owner][_operator];
    }

    function name() override virtual external view returns (string memory _name) {
        return __name;
    }
    
    function symbol() override virtual external view returns (string memory _symbol) {
        return __symbol;
    }
    
    function tokenURI(uint256 _tokenId) override virtual external view returns (string memory) {
        require(__owners[_tokenId] != address(0), "Token does not exists");
        string memory baseURI = __baseURI;
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, __tokens[_tokenId])) : "";
    }

    function safeMint(address _to, string memory _uri, bytes memory _data) external returns(uint256 _tokenId) {
        _tokenId = __mint(_to, _uri);
        __checkContract(address(0), _to, _tokenId, _data);
    }

    function safeMint(address _to, string memory _uri) external returns(uint256 _tokenId) {
        _tokenId = this.safeMint(_to, _uri);
    }

    function mint(address _to, string memory _uri) external returns(uint256 _tokenId) {
        _tokenId = __mint(_to, _uri);
    }

    function __checkContract(address _from, address _to, uint256 _tokenId, bytes memory _data) private {
        if(__isContract(_to)) {
            try IERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data) returns (bytes4 retval) {
                require(retval == IERC721TokenReceiver.onERC721Received.selector);
            } catch (bytes memory reason) {
                assembly { revert(add(32, reason), mload(reason)) }
            }
        }
    }

    function __isContract(address addr) private view returns (bool) {
        uint size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }

    function __transferFrom(address _from, address _to, uint256 _tokenId) private __isApprovedOrOwner(_from, _tokenId) {
        __owners[_tokenId] = _to;
        __balances[_from] -= 1;
        __balances[_to] += 1;
        emit Transfer(_from, _to, _tokenId);
    }

    function __mint(address _to, string memory _uri) private returns(uint256 _tokenId) {
        __counter += 1;
        _tokenId = __counter;
        __tokens[_tokenId] = _uri;
        __owners[_tokenId] = _to;
        __balances[_to] += 1;
        emit Transfer(address(0), _to, _tokenId);
    }
}