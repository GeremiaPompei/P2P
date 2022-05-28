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
        url: "ws://127.0.0.1:7545",
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
                this.initContractAddresses();
                this.address = (await ethereum.enable())[0];
                const web3Provider = new Web3.providers.WebsocketProvider(this.url);
                this.web3 = new Web3(web3Provider);
                this.web3.eth.defaultAccount = this.address;
            } catch(e) {
                this.notify(false, "Wallet connection error", e);
            }
            this.setLoading(false);
        },
        initContractAddresses() {
            this.contracts = {
                ERC721: {contract: undefined, address: "0x78B511d8d8f40F30D6CEa49178e95E77478B1Eda"},
                TRY: {contract: undefined, address: "0x03C32AfC900A82809Ed7309EAe8D752aFBb16BE8"},
            };
        },
        back() {
            this.role = undefined;
            this.initContractAddresses();
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
        async contractFetch(contract, type, fetchFunc, callback=undefined) {
            this.$emit("setLoading", true);
            try {
                const prevFunc = fetchFunc(this.contracts[contract].contract.methods);
                if(type == "call") {
                    const res = await prevFunc.call();
                    await callback(res);
                } else if(type = "send") {
                    const trx = await prevFunc.send({from: this.address, gas: 3000000});
                    if(callback)
                        await callback(trx);
                    this.$emit("notify", true, "[Success]", trx.transactionHash);
                }
            } catch(e) {
                console.error(e);
                if(e.data)
                    this.$emit("notify", false, `[Transaction error]: ${e.data.name}`, Object.values(e.data)[0].reason);
                else 
                    this.$emit("notify", false, "[Internal error]", e);
            }
            this.$emit("setLoading", false);
        }
    }
  });
  
  
  app.mount("#app");
  