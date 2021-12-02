pragma solidity ^0.8.7;
pragma abicoder v2;



contract Random {
    constructor(){

    }
    function random() public view returns(uint){
    return uint(keccak256(abi.encodePacked(block.number, block.timestamp, uint(1))))%60;
}
}