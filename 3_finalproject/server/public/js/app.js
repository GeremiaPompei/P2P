const app = Vue.createApp({
  template: /*html*/ `
    <div class="bg-light">
      <Loading :loading="loading"></Loading>
      <Notification :notification="notification"></Notification>
      <Popup :popup="popup"></Popup>
      <div class="container p-4">
          <div class="row vh-100">
            <div class="col">
                <Menu v-if="role == undefined"
                    @setRole="initContracts"
                ></Menu>
                <div v-else>
                    <div class="btn btn-dark" @click="back()">Back</div>
                    <Manager v-if="role == 'manager'"
                        :address="address"
                        :web3="web3"
                        :contracts="contracts"
                        @setLoading="setLoading"
                        @notify="notify"
                        @sendPopup="sendPopup"
                    ></Manager>
                    <User v-if="role == 'user'"
                        :address="address"
                        :web3="web3"
                        :contracts="contracts"
                        @setLoading="setLoading"
                        @notify="notify"
                        @sendPopup="sendPopup"
                    ></User>
                </div>
            </div>
          </div>
        </div>
      </div>
      `,
  components: {
    Loading: Vue.defineAsyncComponent(() =>
      import("./components/utility/loading.js")
    ),
    Popup: Vue.defineAsyncComponent(() =>
      import("./components/utility/popup.js")
    ),
    Notification: Vue.defineAsyncComponent(() =>
      import("./components/utility/notification.js")
    ),
    Menu: Vue.defineAsyncComponent(() =>
      import("./components/menu.js")
    ),
    User: Vue.defineAsyncComponent(() =>
      import("./components/user.js")
    ),
    Manager: Vue.defineAsyncComponent(() =>
      import("./components/manager.js")
    ),
  },
  data() {
    return {
      url: "",
      address: undefined,
      web3: undefined,
      contracts: {},
      role: undefined,
      loading: false,
      notification: { show: false },
      popup: { show: false },
    };
  },
  async created() {
    await this.init();
  },
  methods: {
    async init() {
      this.setLoading(true);
      try {
        this.url = await (await fetch("/api/endpoint")).text();
        await this.initContractAddresses();
        this.address = (await ethereum.enable())[0];
        const web3Provider = new Web3.providers.WebsocketProvider(this.url);
        this.web3 = new Web3(web3Provider);
        this.web3.eth.defaultAccount = this.address;
      } catch (e) {
        this.notify(false, "Wallet connection error", e);
      }
      this.setLoading(false);
    },
    async initContractAddresses() {
      const addresses = await (await fetch("api/contract_addresses")).json();
      this.contracts = {
        ERC721: { contract: undefined, address: addresses.ERC721 },
        TRY: { contract: undefined, address: addresses.TRY },
      };
    },
    async back() {
      this.role = undefined;
      await this.initContractAddresses();
    },
    async initContracts(role) {
      this.contracts.ERC721.contract = new this.web3.eth.Contract(await (await fetch("contracts/ERC721.json")).json(), this.contracts.ERC721.address);
      this.contracts.TRY.contract = new this.web3.eth.Contract(await (await fetch("contracts/TRY.json")).json(), this.contracts.TRY.address);
      this.role = role;
    },
    setLoading(flag) {
      this.loading = flag;
    },
    notify(flag, title, description = "") {
      this.notification = { flag, title, description, show: true };
    },
    sendPopup(options) {
      this.popup = {
        options,
        show: true,
      };
    },
  },
});

app.mixin({
  methods: {
    async contractFetch(contract, type, fetchFunc, callback = undefined, value = 0) {
      this.$emit("setLoading", true);
      try {
        const prevFunc = await fetchFunc(this.contracts[contract].contract.methods);
        if (type == "call") {
          const res = await prevFunc.call();
          await callback(res);
        } else if (type = "send") {
          let trx;
          const network_type = await this.web3.eth.net.getNetworkType();
          if(network_type == "private") {
            const result = await prevFunc.send({from: this.address, gas: 5000000, value});
            trx = result.transactionHash;
          } else {
            trx = await window.ethereum.request({
              method: "eth_sendTransaction",
              params: [{data: prevFunc.encodeABI(), from: this.address, to: this.contracts[contract].address, value }],
            });
          }
          if (callback)
            await callback(trx);
          this.$emit("notify", true, "[Success]", trx);
        }
      } catch (e) {
        console.error(e);
        if (e.data)
          this.$emit("notify", false, `[Transaction error]: ${e.data.name}`, Object.values(e.data)[0].reason);
        else
          this.$emit("notify", false, "[Internal error]", e);
      }
      this.$emit("setLoading", false);
    },
    formatEvent(e) {
      const title = e.event;
      const v = e.returnValues;
      let description = "";
      switch (title) {
        case "StartNewRound": description = `Start round ${v._round} from block number ${v._blockNumber}`; break;
        case "Buy": description = `Bought new ticket from address ${v._player}`; break;
        case "CloseLottery": description = `Lottery closed from operator`; break;
        case "NoGivePrize": description = `No prize won by ${v._player} in round ${v._round}`; break;
        case "DrawNumbers": description = `Numbers drawn are [${v._n1}, ${v._n2}, ${v._n3}, ${v._n4}, ${v._n5}] with powerball ${v._powerball}`; break;
        case "ChangeState": description = `Change state in ${this.formatState(v._state)}`; break;
        case "GiveBack": description = `Give ${v._value} WEI back to ${v._player}`; break;
        case "GivePrize":
          description = `NFT with token id ${v._tokenId} of class ${v._class} won by ${v._player} in round ${v._round}`;
          if (this.address == v._player)
            this.$emit('notify', true, `You won round ${v._round}`, `You earcn NFT with id ${v._tokenId} of class ${v._class}`);
          break;
      }
      return { title, description };
    },
    formatState(s) {
      switch (s) {
        case "0": return "Buy";
        case "1": return "Draw";
        case "2": return "Prize";
        case "3": return "RoundFinished";
        case "4": return "Close";
      }
    },
    formatClass(c) {
      switch (c) {
        case "1": return "Class_1";
        case "2": return "Class_2";
        case "3": return "Class_3";
        case "4": return "Class_4";
        case "5": return "Class_5";
        case "6": return "Class_6";
        case "7": return "Class_7";
        case "8": return "Class_8";
      }
    }
  }
});


app.mount("#app");
