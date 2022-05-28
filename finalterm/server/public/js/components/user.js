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
      <div class="row d-flex justify-content-md-center">
        <div v-if="contracts.Lottery">
          <h6 class="text-center">
            {{contracts.Lottery.address}}
          </h6>
        </div>
        <div v-else>
          No lottery loaded
        </div>
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
          eventsLotteryCreated: []
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
              toBlock: 'latest'
          };
          this.contracts.TRY.contract.events.LotteryCreated(options).on('data', e => {
            const values = e.returnValues;
            this.eventsLotteryCreated.unshift(values);
          });
        },
        async loadLottery(e) {
          const address = e._addressLottery;
          this.contracts.Lottery = {
            address,
            contract: new this.web3.eth.Contract(this.abiLottery, address)
          }
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
        }
      },
  };