export default {
    template: /*html*/`
    <div v-if="popup.show" class="popup-container">
        <div class="popup-body">
            <button type="button" class="close close-popup" data-dismiss="alert" aria-label="Close" @click="close()">
                <span aria-hidden="true">&times;</span>
            </button>
            <div v-for="(option, key) in popup.options" :key="key">
                <Table v-if="option.type=='table'"
                    :title="option.title"
                    :data="option.data"
                    :fields="option.fields"
                    :notitle="option.notitle"
                    :defaultClose="() => popup.show = false"
                ></Table>
                <Form v-if="option.type=='form'"
                    :structs="option.structs"
                    :title="option.title"
                    :subtitle="option.subtitle"
                    :submit_text="option.submit_text"
                    :done="async (data) => {
                        await option.done(data);
                        popup.show = false;
                    }"
                ></Form>
            </div>
        </div>
    </div>
    `,
    components: {
      Form: Vue.defineAsyncComponent(() =>
        import("./form.js")
      ),
      Table: Vue.defineAsyncComponent(() =>
        import("./table.js")
      ),
    },
    props: {
        popup: Object
    },
    methods: {
        close() {
            this.popup.show = false;
        },
        closeEvent(e) {
            if(e.target.contains(this.$el))
                this.close();
        },
    },
    mounted() {
        document.addEventListener('click', this.closeEvent);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.closeEvent);
    }
}