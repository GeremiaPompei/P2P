export default {
    template: /*html*/ `
    <div>
      <div class="text-center">
        <h1>Manager</h1>
      </div>
      <div class="col">
          <div class="row m-2 d-flex justify-content-md-center">
              <button @click="popupNewLottery()" class="btn btn-primary m-2">
                New
              </button>
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
                      <h5 :class="info.state != 'RoundFinished' ? 'text-success' : 'text-danger'">ROUND {{info.state != 'RoundFinished' ? 'OPEN' : 'CLOSE'}}</h5>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col" v-if="info.state == 'RoundFinished'">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="startNewRound()" class="btn btn-primary m-2">Start new round</button>
                    </div>
                  </div>
                  <div class="col" v-if="info.state == 'Draw'">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="drawNumbers()" class="btn btn-primary m-2">Draw numbers</button>
                    </div>
                  </div>
                  <div class="col" v-if="info.state == 'Prize'">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="givePrizes()" class="btn btn-primary m-2">Give prizes</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="popupMint()" class="btn btn-primary m-2">Mint</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="popupPrizes()" class="btn btn-primary m-2">Prizes</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="closeLottery()" class="btn btn-danger m-2">Close lottery</button>
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
          prizes: []
        }
      },
      async created() {
        this.$emit("setLoading", true);
        this.abiLottery = await (await fetch("contracts/Lottery_manager.json")).json();
        await this.loadEvents();
        this.$emit("setLoading", false);
      },
      methods: {
        async loadEvents() {
          this.contracts.TRY.contract.events.LotteryCreated({
            fromBlock: 0,
            toBlock: 'latest'
          }).on('data', e => {
            if(this.address.toUpperCase() == e.returnValues._owner.toUpperCase())
              this.eventsLotteryCreated.unshift(e.returnValues);
          });
        },
        async createLottery(data) {
          await this.contractFetch(
            "TRY", "send",
            f => f.createLottery(data.duration, data.k, data.ticketPrice), 
            trx => {
              this.loadLottery(trx.events.LotteryCreated.returnValues);
              this.newLottery = {duration: "", k: "", ticketPrice: ""};
            }
          );
        },
        async initPrizes() {
          this.prizes.splice(0);
          for(let i = 0; i < 8; i++) {
            await this.contractFetch("Lottery", "call", f => f.collectibles(i+1), (r) => this.prizes.push({collectible: r, class: (i+1)}));
          }
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
          await this.initPrizes();
          this.allEvents.splice(0);
          this.contracts.Lottery.contract.events.allEvents({
            fromBlock: 0,
            toBlock: 'latest'
          }).on('data', e => this.allEvents.unshift(this.formatEvent(e)));
          this.contracts.Lottery.contract.events.ChangeState({
            fromBlock: 0,
            toBlock: 'latest'
          }).on('data', s => this.info.state = this.formatState(s.returnValues._state));
          this.$emit("setLoading", false);
        },
        async startNewRound() {
          await this.contractFetch("Lottery", "send", f => f.startNewRound(), this.update);
        },
        async update() {
          await this.loadLottery({_addressLottery: this.contracts.Lottery.address});
        },
        async drawNumbers() {
          await this.contractFetch("Lottery", "send", f => f.drawNumbers(), this.update);
        },
        async givePrizes() {
          await this.contractFetch("Lottery", "send", f => f.givePrizes(), this.update);
        },
        async closeLottery() {
          await this.contractFetch("Lottery", "send", f => f.closeLottery(), this.update);
        },
        async mint(data) {
          await this.contractFetch("Lottery", "send", f => f.mint(data.uri, data.class), this.update);
        },
        popupNewLottery() {
          this.$emit(
            'sendPopup', 
            [
              {
                type: "form",
                title: "New lottery",
                structs: [
                  [{type: 'number', title: 'Duration', attribute: 'duration', value: ""}],
                  [{type: 'number', title: 'K', attribute: 'k', value: ""}],
                  [{type: 'number', title: 'Ticket price in WEI', attribute: 'ticketPrice', value: ""}]
                ],
                submit_text: "Create",
                done: async (data) => {
                  await this.createLottery(data);
                },
              }
            ]
          );
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
        popupMint() {
          this.$emit(
            'sendPopup', 
            [
              {
                type: "form",
                title: "Mine new NFT",
                structs: [
                  [{type: 'select', attribute: 'class', options: [
                    {label: 'Class 1', value: '1'},
                    {label: 'Class 2', value: '2'},
                    {label: 'Class 3', value: '3'},
                    {label: 'Class 4', value: '4'},
                    {label: 'Class 5', value: '5'},
                    {label: 'Class 6', value: '6'},
                    {label: 'Class 7', value: '7'},
                    {label: 'Class 8', value: '8'},
                  ]}],
                  [{type: 'text', title: 'Url image', attribute: 'uri', value: ""}],
                ],
                submit_text: "Create",
                done: async (data) => {
                  await this.mint(data);
                },
              }
            ]
          );
        },
        popupPrizes() {
          this.prizes.sort((a, b) => a.class - b.class);
          this.$emit(
            'sendPopup', 
            [
              {
                title: "Prizes",
                type: "table",
                fields: [
                  {title: 'Class', type: 'text', value: 'class'},
                  {title: 'Id', type: 'text', value: 'tokenId'},
                  {title: 'NFT', type: 'img', value: 'uri'},
                ],
                data: this.prizes.filter(c => Number.parseInt(c.collectible.tokenId) > 0).map(c => {return {class: c.class, tokenId: c.collectible.tokenId, uri: c.collectible.uri};})
              }
            ]
          );
        },
      },
  };