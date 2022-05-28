export default {
  template: /*html*/ `
  <div>
    <div class="text-center">
      <h1>User</h1>
    </div>
    <div class="col">
        <div class="row m-2 d-flex justify-content-md-center">
            <button @click="popupListLotteries()" class="btn btn-primary m-2">
              Lotteries
            </button>
        </div>
        <div v-if="contracts.Lottery" class="row">
          <div class="col">
            <div class="row d-flex justify-content-md-center">
              <div>
                <h6 class="text-center">
                  {{contracts.Lottery.address}}
                </h6>
              </div>
            </div>
            <div v-if="lotteryStatus">
              <div class="row">
                <div class="col">
                  <div class="row d-flex justify-content-md-center">
                    <h5 :class="roundStatus ? 'text-success' : 'text-danger'">ROUND {{roundStatus ? 'OPEN' : 'CLOSE'}}</h5>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col" v-if="roundStatus">
                  <div class="row d-flex justify-content-md-center">
                    <button @click="popupBuy()" class="btn btn-primary m-2">Buy</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="row d-flex justify-content-md-center">
              <h5 class="text-danger">Lottery is closed</h5>
            </div>
          </div>
        </div>
        <div v-else class="row d-flex justify-content-md-center">
          No lottery loaded
        </div>
    </div>
  </div>
    `,
    props: {
      address: String,
      web3: Object,
      contracts: Object
    },
    data() {
      return {
        abiLottery: {},
        eventsLotteryCreated: [],
        lotteryStatus: undefined,
        roundStatus: undefined,
      }
    },
    async created() {
      this.$emit("setLoading", true);
      this.abiLottery = await (await fetch("contracts/Lottery_user.json")).json();
      await this.loadEvents();
      this.$emit("setLoading", false);
    },
    methods: {
      async loadEvents() {
        const options = {
          fromBlock: 0,
          toBlock: 'latest',
          filter: {
            _owner: this.address.toUpperCase()
          }
        };
        this.contracts.TRY.contract.events.LotteryCreated(options).on('data', e => this.eventsLotteryCreated.unshift(e.returnValues));
      },
      async loadLottery(e) {
        this.$emit("setLoading", true);
        const address = e._addressLottery;
        this.contracts.Lottery = {
          address,
          contract: new this.web3.eth.Contract(this.abiLottery, address)
        };
        await this.contractFetch("Lottery", "call", async f => f.lotteryOpen(), r => this.lotteryStatus = r);
        await this.contractFetch("Lottery", "call", f => f.isRoundActive(), r => this.roundStatus = r);
        this.$emit("setLoading", false);
      },
      async update() {
        await this.loadLottery({_addressLottery: this.contracts.Lottery.address});
      },
      async buy(data) {
        let ticketPrice = 0;
        await this.contractFetch("Lottery", "call", f => f.ticketPrice(), r => ticketPrice = r);
        await this.contractFetch("Lottery", "send", f => f.buy([data.n1, data.n2, data.n3, data.n4,  data.n5,  data.powerball]), this.update, ticketPrice);
      },
      popupListLotteries() {
        this.$emit(
          'sendPopup', 
          [
            {
              title: "Lotteries",
              type: "table",
              fields: [
                {title: '', type: 'button', value: '_addressLottery', select: this.loadLottery},
              ],
              notitle: true,
              data: this.eventsLotteryCreated
            }
          ]
        );
      },
      popupBuy() {
        this.$emit(
          'sendPopup', 
          [
            {
              type: "form",
              title: "Play numbers",
              structs: [[
                {type: 'number', title: 'N1', attribute: 'n1', value: "", min: 1, max: 69},
                {type: 'number', title: 'N2', attribute: 'n2', value: "", min: 1, max: 69},
                {type: 'number', title: 'N3', attribute: 'n3', value: "", min: 1, max: 69},
                {type: 'number', title: 'N4', attribute: 'n4', value: "", min: 1, max: 69},
                {type: 'number', title: 'N5', attribute: 'n5', value: "", min: 1, max: 69},
                {type: 'number', title: 'Powerball', attribute: 'powerball', value: "", min: 1, max: 26},
              ]],
              submit_text: "Create",
              done: async (data) => {
                await this.buy(data);
              },
            }
          ]
        );
      },
    },
};