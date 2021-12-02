pragma solidity ^0.8.0;
pragma abicoder v2; // required to accept structs as function parameters

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-solidity/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/utils/cryptography/draft-EIP712.sol";
import "openzeppelin-solidity/contracts/access/AccessControl.sol";

    contract Nftcontract is ERC721URIStorage {
    event MadeContact(address hostaddress, string symbol);
    uint256 counter = 0;
    string public eventdata;
    address public owner;
    mapping(address => int256) public own;

    address private _mastercontract; 
    event mintnft(uint tokenid,address owner,string uri,string id);
    
    struct Event{
        string id;
    }
    mapping(uint256=> Event) events;
    constructor(
        string memory symbol,
        string memory name) public ERC721(name, symbol){
        own[tx.origin] = 1;
     
        owner = tx.origin;
    }


  


    function mint(string memory uri,string memory id)
        public
        
        returns (uint256) 
    {
        counter++;
        
        _mint(tx.origin,counter);
        _setTokenURI(counter,uri);
        emit mintnft(counter,tx.origin,uri,id);
        return counter;
    
   
            // transfer the token to the minter
      //  _mint(tx.origin, counter);
        //set metadata
    //    _setTokenURI(counter, uri);
      //  nftevent[counter] = eventnft;
    //    pricenft[counter] = price;
        // record payment to signer's withdrawal balance
      //  emit mintnft(counter,tx.origin,uri,eventnft,price);
        // onsell[counter] = true;
        //return counter;
    }
    
 
    


   
}
