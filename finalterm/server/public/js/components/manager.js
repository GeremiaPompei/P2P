export default {
    template: /*html*/ `
    <div>
      <div class="text-center">
        <h1>Manager</h1>
      </div>
      <div class="row">
        <div class="col w-20 border-right">
          <div class="row m-2">
            <div class="col d-flex justify-content-center">
              <form class="p-4 border rounded bg-white" @submit.prevent="createLottery()">
              <h5 class="text-center">Create new lottery</h5>
                <div class="row d-flex justify-content-around">
                  <input class="m-2 text-center" type="number" min="1" class="form-control" id="lottery_duration" placeholder="Duration" v-model="newLottery.duration">
                  <input class="m-2 text-center" type="number" min="1" max="250" class="form-control" id="lottery_k" placeholder="k" v-model="newLottery.k">
                  <input class="m-2 text-center" type="number" min="1" class="form-control" id="lottery_ticketPrice" placeholder="Ticket price in WEI" v-model="newLottery.ticketPrice">
                  <button type="submit" class="btn btn-primary m-2">Create lottery</button>
                </div>
              </form>
              </div>
            </div>
            <div class="row">
              <ListLotteries 
                :eventsLotteryCreated="eventsLotteryCreated"
                @loadLottery="loadLottery"
              ></ListLotteries>
            </div>
        </div>
        <div class="col w-80" v-if="contracts.Lottery">
          <div class="row">
            <h5 class="text-center">
              {{contracts.Lottery.address}}
            </h5>
          </div>
        </div>
      </div>
    </div>
      `,
      components: {
        ListLotteries: Vue.defineAsyncComponent(() =>
          import("./utility/list_lotteries.js")
        ),
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
          newLottery: {
            duration: "",
            k: "",
            ticketPrice: ""
          },
        }
      },
      async created() {
        this.abiLottery = await (await fetch("contracts/Lottery_manager.json")).json();
        await this.loadEvents();
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
          this.eventsLotteryCreated = (await this.contracts.TRY.contract.getPastEvents('LotteryCreated', options));
          this.eventsLotteryCreated.reverse();
          this.contracts.TRY.contract.events.LotteryCreated(options).on('data', (event) => {
            this.eventsLotteryCreated.unshift(event);
            this.loadLottery(event.returnValues._addressLottery);
          });
        },
        async createLottery() {
          this.$emit("loading", true);
          try {
            const trx = await this.contracts.TRY.contract.methods
              .createLottery(this.newLottery.duration, this.newLottery.k, this.newLottery.ticketPrice)
              .send({from: this.address, gas: 3000000});
            this.$emit("notify", true, "Success", `Created new lottery with trx ${trx.transactionHash}`);
          } catch(e) {
            this.$emit("notify", false, "Error", e);
          }
          this.newLottery = {duration: "", k: "", ticketPrice: ""};
          this.$emit("loading", false);
        },
        async loadLottery(address) {
          this.contracts.Lottery = {
            address,
            contract: new this.web3.eth.Contract(this.abiLottery, address)
          }
        }
      },
  };