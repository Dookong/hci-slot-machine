App = {
  web3Provider: null,
  contracts: {},
  balance: 0,
  account: null,
  instance: null,
  machine1: null,
  machine2: null,
  machine3: null,
  started: 0,
  roll1: -1,
  roll2: -1,
  roll3: -1,
  rolled: false,
  audio: null,

  init: async function() {
    App.audio = document.getElementById("audio");
    $("#desc").hide();
    await App.initWeb3();
    return App.initContract();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to the Alchemy provider.
    else {
      App.web3Provider = new Web3.providers.HttpProvider('https://eth-sepolia.g.alchemy.com/');
      toastr.warning('메타마스크 확장 프로그램이 필요합니다!');
    }
    web3 = new Web3(App.web3Provider);
  },

  initContract: function() {
    $.ajaxSetup({async: false});
    $.getJSON('SlotMachine.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var SlotMachineArtifact = data;

      try {
        App.contracts.SlotMachine = TruffleContract(SlotMachineArtifact);

        // Set the provider for our contract.
        App.contracts.SlotMachine.setProvider(App.web3Provider);

        App.checkAccount();
        App.slotMachine();
      } catch(err) {
        console.log(err);
      }

    });

    return App.bindEvents();
  },

  bindEvents: function() {
     $(document).on('click', '#slotMachineButtonShuffle', App.startRoll);
     $(document).on('click', '#withdraw', App.withdraw);
  },

  withdraw: function() {

       App.checkBalance();

      if(App.balance != 0) {
        instance.withdraw.sendTransaction({from: App.account, value: 0}).then(function(resp) {
            console.log(resp);

            setTimeout(App.checkBalance, 2000);
 
        })
        .catch(function(err) {
            console.log(err);
        });
      } else {
          toastr.error('출금가능한 상금이 없습니다:(');
      }
  },

  checkAccount: function() {
    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.log(error);
        }

        App.account = accounts[0];

        App.contracts.SlotMachine.deployed().then(function(_instance) {
            instance = _instance;

             var event = instance.Rolled();
            
             event.watch(function(err, resp) {
                 if(resp.event === "Rolled") {
                    if (resp.args.sender.valueOf() == App.account){
                      $("#slotMachineButtonStop").attr("disabled", false);
                      $("#slotMachineButtonStop").attr("title", "");
                      $("#header-msg").text("슬롯머신(탈중앙화)");
 
                      App.roll1 = resp.args.rand1.valueOf();
                      App.roll2 = resp.args.rand2.valueOf();
                      App.roll3 = resp.args.rand3.valueOf();
 
                      App.rolled = true;
 
                      console.log(App.roll1, App.roll2, App.roll3);
 
                      toastr.success('처리 완료!', '정지 버튼을 눌러서 결과를 확인하세요');
                      App.audio.play()
 
                      setTimeout(App.checkBalance, 1000);
                      url = `https://sepolia.etherscan.io/tx/${resp.transactionHash}`;
                      $("#etherscan").text(url);
                      $("#etherscan").attr("href", url);
                      $("#desc").show();
                    }
                 }
             });

            App.checkBalance();
        })
        .catch(function(err) {
            console.log(err)
            toastr.warning('이더리움 지갑 연결을 확인하세요!');
        });
    });
  },

   checkBalance: function() {

    instance.balanceOf.call(App.account).then(function(_balance) {

        App.balance = _balance.valueOf();

        var balanceInEther = web3.fromWei(App.balance, "ether");

        $("#balance").text(balanceInEther + " ether");
        
    });
   },
       

  startRoll: function() {
    event.preventDefault();

    if(App.started != 0) {
        return;
    }

    App.contracts.SlotMachine.deployed().then(function(instance) {
        return instance.oneRoll.sendTransaction({from: App.account, value: web3.toWei('0.01', 'ether')});
    }).then(function() {
        App.startShuffle();
    })
    .catch(function(err) {
        toastr.warning('이더리움 지갑 연결을 확인하세요!');
    });
  },

  prizeWon: function() {
    audio.pause();
    audio.load();

    var msg = "";

    if(App.roll1 == 5 && App.roll2 == 5 && App.roll3 == 5) {
        msg = "잭팟!! 1 이더리움 획득!";
    } else if(App.roll1 == 6 && App.roll2 == 6 && App.roll3 == 6)  {
        msg = "축하합니다! 0.1 이더리움 획득!";
    } else if(App.roll1 == 4 && App.roll2 == 4 && App.roll3 == 4)  {
        msg = "축하합니다! 0.05 이더리움 획득!";
    } else if(App.roll1 == 3 && App.roll2 == 3 && App.roll3 == 3)  {
        msg = "축하합니다! 0.04 이더리움 획득!";
    } else if(App.roll1 == 2 && App.roll2 == 2 && App.roll3 == 2)  {
        msg = "축하합니다! 0.03 이더리움 획득!";
    } else if(App.roll1 == 1 && App.roll2 == 1 && App.roll3 == 1)  {
        msg = "축하합니다! 0.02 이더리움 획득!";
    } else if((App.roll1 == App.roll2) || (App.roll1 == App.roll3) || (App.roll2 == App.roll3)) {
        msg = "보너스 스핀! 0.01 이더리움 획득!";
    } else {
        msg = "낙첨! 다음 기회를 노려보세요ㅠㅠ";
    }

    $("#header-msg").text(msg);

    App.checkBalance();

    toastr.success(msg);

    $("#slotMachineButtonShuffle").attr("disabled", false);
  },

  startShuffle: function() {
    App.started = 3;
    App.machine1.shuffle();
    App.machine2.shuffle();
    App.machine3.shuffle();

    $("#slotMachineButtonShuffle").attr("disabled", true);
    $("#slotMachineButtonStop").attr("disabled", true);

    var pls = "스마트 컨트랙트 트랜잭션 처리중..";

    $("#slotMachineButtonStop").attr("title", pls);

    $("#header-msg").text(pls);
  },

  slotMachine: function() {

      	App.machine1 = $("#casino1").slotMachine({
            active	: 0,
            delay	: 500
        });

        App.machine2 = $("#casino2").slotMachine({
            active	: 1,
            delay	: 500
        });

        App.machine3 = $("#casino3").slotMachine({
            active	: 2,
            delay	: 500
        });

        App.machine1.setRandomize(function() { return App.roll1 - 1; });
        App.machine2.setRandomize(function() { return App.roll2 - 1; });
        App.machine3.setRandomize(function() { return App.roll3 - 1; });

        App.started = 0;

        $("#slotMachineButtonStop").click(function(){

            //if we didn't get the result from the blockchain
            if(!App.rolled) {
                return;
            }

            switch(App.started){
                case 3:
                    App.machine1.stop();
                    break;
                case 2:
                    App.machine2.stop();
                    break;
                case 1:
                    App.machine3.stop();
                    App.prizeWon();

                    App.rolled = false; //reset the roll logic
                    break;
            }
            App.started--;
        });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
