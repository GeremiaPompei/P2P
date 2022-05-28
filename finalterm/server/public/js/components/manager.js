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
                  <div class="col" v-if="!roundStatus">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="startNewRound()" class="btn btn-primary m-2">Start new round</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="drawNumbers()" class="btn btn-primary m-2">Draw numbers</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="popupMint()" class="btn btn-primary m-2">Mint</button>
                    </div>
                  </div>
                  <div class="col">
                    <div class="row d-flex justify-content-md-center">
                      <button @click="givePrizes()" class="btn btn-primary m-2">Give prizes</button>
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
        this.abiLottery = await (await fetch("contracts/Lottery_manager.json")).json();
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
        async loadLottery(e) {
          this.$emit("setLoading", true);
          const address = e._addressLottery;
          this.contracts.Lottery = {
            address,
            contract: new this.web3.eth.Contract(this.abiLottery, address)
          };
          await this.contractFetch("Lottery", "call", f => f.lotteryOpen(), async r => this.lotteryStatus = r);
          await this.contractFetch("Lottery", "call", f => f.isRoundActive(), r => this.roundStatus = r);
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
          await this.contractFetch("Lottery", "send", f => f.mint(data.uri), this.update);
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
                  [{type: 'number', title: 'Ticket price', attribute: 'ticketPrice', value: ""}]
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
                  [{type: 'text', title: 'URI', attribute: 'uri', value: ""}],
                ],
                submit_text: "Create",
                done: async (data) => {
                  await this.mint(data);
                },
              }
            ]
          );
        },
      },
  };