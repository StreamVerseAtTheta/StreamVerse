pragma solidity ^0.8.0;
pragma abicoder v2; // required to accept structs as function parameters

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-solidity/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/utils/cryptography/draft-EIP712.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";

contract ThetaNFT is ERC721URIStorage {
    event MadeContact(address hostaddress, string symbol);
    uint256 counter = 0;
    string public eventdata;
    address public owner;
    mapping(address => int256) public own;
    mapping(uint256 => uint256) public nftevent;
    mapping(uint256 => uint256) public pricenft;
    mapping(uint256 => bool) public onsell;
    address private _mastercontract; 
    event mintnft(uint tokenid,address owner,string uri,uint256 nftevent,uint256 pricenft);
    event buynft(uint tokenid,address buyer);
    event setprice(uint tokenid,uint256 price);
   


    constructor(
        string memory symbol,
        string memory name) public ERC721(name, symbol){
        own[tx.origin] = 1;
     
        owner = tx.origin;
    }

     modifier onlyMaster() {
        require(
            _mastercontract == msg.sender,
            "Function only for FightDie contract!"
        );
        _;
    }

    /*{
       
       
           _mint(tx.origin, counter);
        _setTokenURI(counter, uri);
        SIGNING_DOMAIN = sign_domain;
       
    }*/

  


    function mint(string memory uri, uint256 eventnft ,uint256 price)
        public
        
        returns (uint256)
    {
    
        counter++;
            // transfer the token to the minter
        _mint(tx.origin, counter);
        //set metadata
        _setTokenURI(counter, uri);
        nftevent[counter] = eventnft;
        pricenft[counter] = price;
        // record payment to signer's withdrawal balance
        emit mintnft(counter,tx.origin,uri,eventnft,price);
         onsell[counter] = true;
        return counter;
    }
    
    function buy(uint256 tokenId) public payable {
        require(msg.value >= pricenft[tokenId],"Pay according to the price");
        require(onsell[tokenId] == true,"The token is not on sale");
        address  owne = payable(ownerOf(tokenId));
        payable(owne).transfer(msg.value);
        _transfer(owne, tx.origin,tokenId);
        onsell[tokenId] = false;
        emit buynft(tokenId,tx.origin);
        
        
        
        
    }
    
    function setPrice(uint256 tokenId,uint256 price) public{
        require(ownerOf(tokenId) == tx.origin,"you are not the owner");
        onsell[tokenId] = true;
        pricenft[tokenId] = price;
        emit setprice(tokenId,price);
        
    }

   
}
