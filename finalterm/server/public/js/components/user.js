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
              <h6 class="text-center">
                Lottery: {{contracts.Lottery.address}}
              </h6>
            </div>
            <div class="row d-flex justify-content-md-center">
              <div class="col">
                <p class="text-center">
                  Duration: {{info.duration}}
                </p>
              </div>
              <div class="col">
                <p class="text-center">
                  Round: {{info.round}}
                </p>
              </div>
              <div class="col">
                <p class="text-center">
                  Ticket price: {{info.ticketPrice}} WEI
                </p>
              </div>
              <div class="col">
                <p class="text-center">
                  First block number of round: {{info.startRoundBlockNumber}}
                </p>
              </div>
            </div>
            <div v-if="info.state != 'Close'">
              <div class="row">
                <div class="col">
                  <div class="row d-flex justify-content-md-center">
                    <h5>State: {{info.state}}</h5>
                  </div>
                </div>
                <div class="col">
                  <div class="row d-flex justify-content-md-center">
                    <h5 :class="info.state == 'Buy' ? 'text-success' : 'text-danger'">You {{info.state == 'Buy' ? 'can' : 'cannot'}} buy</h5>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col" v-if="info.state == 'Buy'">
                  <div class="row d-flex justify-content-md-center">
                    <button @click="popupBuy()" class="btn btn-primary m-2">Buy</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="row d-flex justify-content-md-center">
              <h5 class="text-danger">Lottery is closed</h5>
            </div>
            <div class="row d-flex justify-content-md-center">
              <Table
                title="Events"
                :data="allEvents"
                :fields="[
                  {title: 'Title', type: 'text', value: 'title'},
                  {title: 'Description', type: 'text', value: 'description'},
                ]"
              ></Table>
            </div>
          </div>
        </div>
        <div v-else class="row d-flex justify-content-md-center">
          No lottery loaded
        </div>
    </div>
  </div>
    `,
    components: {
      Table: Vue.defineAsyncComponent(() => import("./utility/table.js")),
    },
    props: {
      address: String,
      web3: Object,
      contracts: Object
    },
    data() {
      return {
        abiLottery: {},
        eventsLotteryCreated: [],
        allEvents: [],
        info: {},
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
        this.contracts.TRY.contract.events.LotteryCreated({
          fromBlock: 0,
          toBlock: 'latest',
        }).on('data', e => {
          this.eventsLotteryCreated.unshift(e.returnValues);
          this.$emit("notify", true, "New lottery available", e.returnValues._addressLottery);
        });
      },
      async loadLottery(e) {
        this.$emit("setLoading", true);
        const address = e._addressLottery;
        this.contracts.Lottery = {
          address,
          contract: new this.web3.eth.Contract(this.abiLottery, address)
        };
        await this.contractFetch("Lottery", "call", f => f.state(), async r => this.info.state = this.formatState(r));
        await this.contractFetch("Lottery", "call", f => f.duration(), r => this.info.duration = r);
        await this.contractFetch("Lottery", "call", f => f.round(), r => this.info.round = r);
        await this.contractFetch("Lottery", "call", f => f.startRoundBlockNumber(), r => this.info.startRoundBlockNumber = r);
        await this.contractFetch("Lottery", "call", f => f.ticketPrice(), r => this.info.ticketPrice = r);
        this.allEvents.splice(0);
        this.contracts.Lottery.contract.events.allEvents({
          fromBlock: 0,
          toBlock: 'latest'
        }).on('data', e => this.allEvents.unshift(this.formatEvent(e)));
        this.$emit("setLoading", false);
      },
      async update() {
        await this.loadLottery({_addressLottery: this.contracts.Lottery.address});
      },
      async buy(data) {
        let ticketPrice = 0;
        await this.contractFetch("Lottery", "call", f => f.ticketPrice(), r => ticketPrice = r);
        await this.contractFetch("Lottery", "send", f => f.buy([data.n1, data.n2, data.n3, data.n4,  data.n5,  data.powerball]), undefined, ticketPrice);
        await this.update();
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