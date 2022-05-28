export default {
    template: /*html*/ `
    <div>
        <div class="row d-flex justify-content-center">
            <h5>Lotteries</h5>
        </div>
        <div class="row overflow-auto border rounded p-2 bg-white d-flex justify-content-center" style="max-height: 300px;">
            <div v-if="eventsLotteryCreated.length == 0">
                Not existing lottery
            </div>
            <div v-else v-for="(e, index) in eventsLotteryCreated" :key="index">
                <div class="btn btn-success m-2" @click="() => $emit('loadLottery', e.returnValues._addressLottery)">
                    {{e.returnValues._addressLottery}}
                </div>
            </div>
        </div>
    </div>
    `,
    props: {
        eventsLotteryCreated: Array
    }
};