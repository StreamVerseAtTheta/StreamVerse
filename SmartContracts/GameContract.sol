pragma solidity ^0.8.7;
pragma abicoder v2;

    
    interface ERC20I {
        function mintTo(address to, uint256 amount) external returns (bool);
    
        function balanceOf(address account) external view returns (uint256);
    
        function burnFromAcc(address from, uint256 amount) external returns (bool);
    }

 contract GameContract  {
 
   event AskWork(uint256 workid,address worker,uint256 givenblock,uint256 totalblock,uint256 reward);
   event TakeWork(uint256 workid,address worker, uint256 startblock,uint256 endblock,uint256 lockedcoffe,uint256 lockedchocolate,uint256 lockedenergy);
   event CompleteWork(uint256 workid,address worker);
   event UpgradeComputer(uint256 upgrade,address worker);
   event faucet(address worker);



       
       
         address public coffee = 0xF3745a3EC1a21DFDf04526f3a861CD373E7E761c;
         address public drinks = 0xb568f275c7F206F297ccB216710E6d76685ffB1A;
         address public chocolate= 0xbd2b454e716636Cd17cd013810e6B50D8911749f;
         address public work = 0x1bA593E3E6e8866b5dfAcF0911418E506c3be19A;
         uint256  public currentval;

        

        struct Work{
            uint256 givenblock;
            uint256 startblock;
            uint256 endblock;
            uint256 totalblock;
            uint256 reward;
            bool started;
            bool notcompleted;
        
        } 
        struct Player{
            uint256 lastworkblock;
            mapping(uint256=>Work) Works;
            bool isworking;
            uint256 level;
            uint256 computerlevel;
            uint256 lockedcoffee;
            uint256 lockedchocolate;
            uint256 lockedenergy;
            uint256 currentworkint ;
            bool faucet;
        }
        
        
        mapping(address=>Player) players;
    constructor()  {
   
    }

    function upgratecomputer() public {
      require((players[tx.origin].computerlevel+1)*10**20<ERC20I(work).balanceOf(tx.origin),"not enough balance");
      ERC20I(work).burnFromAcc(tx.origin, (players[tx.origin].computerlevel+1)*10**20);
      players[tx.origin].computerlevel = players[tx.origin].computerlevel+1;
      emit UpgradeComputer(players[tx.origin].computerlevel,tx.origin);
    }

    function viewlevel() public view returns(uint256){
        return players[tx.origin].computerlevel;
    }
    function completework() public {
        uint256 currentworkint = players[tx.origin].currentworkint;
        require(players[tx.origin].Works[currentworkint].endblock < block.number && players[tx.origin].Works[currentworkint].notcompleted == true  && players[tx.origin].Works[currentworkint].started == true ,"work not done");
        ERC20I(coffee).mintTo(tx.origin,players[tx.origin].lockedcoffee*10**18);
        ERC20I(chocolate).mintTo(tx.origin,players[tx.origin].lockedchocolate*10**18);
        ERC20I(drinks).mintTo(tx.origin,players[tx.origin].lockedenergy*10**18);
        ERC20I(work).mintTo(tx.origin,players[tx.origin].Works[currentworkint].reward*10**18);
        players[tx.origin].lockedcoffee = 0;
        players[tx.origin].lockedenergy = 0;
        players[tx.origin].lockedchocolate= 0;
        players[tx.origin].isworking = false;
        players[tx.origin].lastworkblock = block.number;
        players[tx.origin].Works[currentworkint].notcompleted =  false;
        emit CompleteWork(currentworkint,tx.origin);
       

  }


     function takework(uint256 coffeen, uint256 chocolaten, uint256 energyn) public{
      uint256 currentworkint = players[tx.origin].currentworkint;
      require(coffeen+(chocolaten*3)+ energyn*2 >= players[tx.origin].Works[currentworkint].totalblock,"not enough materail");
      require(ERC20I(coffee).balanceOf(tx.origin)>= coffeen,"not enough coffee");
      require(ERC20I(chocolate).balanceOf(tx.origin)>= chocolaten,"not enough coffee");
      require(ERC20I(drinks).balanceOf(tx.origin)>= energyn,"not enough coffee");
      players[tx.origin].isworking = true;
      ERC20I(coffee).burnFromAcc(tx.origin,coffeen*10**18);
      ERC20I(chocolate).burnFromAcc(tx.origin,chocolaten*10**18);
      ERC20I(drinks).burnFromAcc(tx.origin,energyn*10**18);
      players[tx.origin].lockedcoffee = coffeen;
      players[tx.origin].lockedenergy = energyn;
      players[tx.origin].lockedchocolate= chocolaten;
      players[tx.origin].Works[currentworkint].startblock = block.number;
      players[tx.origin].Works[currentworkint].endblock = block.number+players[tx.origin].Works[currentworkint].totalblock;
      players[tx.origin].Works[currentworkint].started = true;
      emit TakeWork(currentworkint,tx.origin, block.number,players[tx.origin].Works[currentworkint].endblock,coffeen,chocolaten,energyn);
   
     
  }

  function getwork() public {
      uint256 currentworkint = players[tx.origin].currentworkint;
      require(players[tx.origin].Works[currentworkint].endblock < block.number && players[tx.origin].Works[currentworkint].notcompleted == false,"you already have a job");
      uint256 number = block.number;
      ERC20I(work).burnFromAcc(tx.origin,2*10**18);
     // uint256 test = (uint256(uint8(bytes32(blockhash(number))[15]))%16+players[tx.origin].level)*30;
      uint256 test = uint256(keccak256(abi.encodePacked(block.number, block.timestamp, uint(60))))%60 + players[tx.origin].level;
      players[tx.origin].currentworkint = currentworkint+1;
      uint256 upatedint = players[tx.origin].currentworkint;
      players[tx.origin].Works[upatedint].givenblock = block.number;
      players[tx.origin].Works[upatedint].reward = test/10;
      players[tx.origin].Works[upatedint].totalblock = test;
      players[tx.origin].Works[upatedint].notcompleted = true;
      players[tx.origin].level++;
      emit AskWork(upatedint,tx.origin,block.number,test,players[tx.origin].Works[upatedint].reward);
     
  
      
  }

  function getStarted() public {
        require(players[tx.origin].faucet == false,"Already claimed the faucet");
        ERC20I(coffee).mintTo(tx.origin,200*10**18);
        ERC20I(work).mintTo(tx.origin,100*10**18);
        players[tx.origin].faucet = true;  
        emit faucet(tx.origin); 
  }

  

 

  function getworkdetail() public view returns(uint256,uint256){
      return (players[tx.origin].Works[players[tx.origin].currentworkint].reward,players[tx.origin].Works[players[tx.origin].currentworkint].totalblock);

  }



 }



         
        
       
    