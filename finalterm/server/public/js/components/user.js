export default {
    template: /*html*/ `
    <div>
      <div class="text-center">
        <h1>User</h1>
      </div>
      <div class="row">
        <div class="col w-20 border-right">
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
          eventsLotteryCreated: []
        }
      },
      async created() {
        this.abiLottery = await (await fetch("contracts/Lottery_user.json")).json();
        await this.loadEvents();
      },
      methods: {
        async loadEvents() {
          const options = {
              fromBlock: 0,
              toBlock: 'latest'
          };
          this.eventsLotteryCreated = await this.contracts.TRY.contract.getPastEvents('LotteryCreated', options);
          this.eventsLotteryCreated.reverse();
          this.contracts.TRY.contract.events.LotteryCreated(options).on("data", data => this.eventsLotteryCreated.unshift(data));
        },
        async loadLottery(address) {
          this.contracts.Lottery = {
            address,
            contract: new this.web3.eth.Contract(this.abiLottery, address)
          }
        }
      }
  };