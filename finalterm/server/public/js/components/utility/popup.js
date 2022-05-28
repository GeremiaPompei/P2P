export default {
    template: /*html*/`
    <div v-if="popup.show" class="popup-container">
        <div class="popup-body">
            <button type="button" class="close close-popup" data-dismiss="alert" aria-label="Close" @click="close()">
                <span aria-hidden="true">&times;</span>
            </button>
            <label class="my-title">{{popup.title}}</label>
            <label class="my-description" v-html="popup.description"></label>
            <div class="popup-buttons">
                <button class="my-btn" v-if="popup.submit" @click="submit()">{{popup.submit.label}}</button>
            </div>
        </div>
    </div>
    `,
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
        submit() {
            this.close();
            this.popup.submit.callback()
        }
    },
    mounted() {
        document.addEventListener('click', this.closeEvent);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.closeEvent);
    }
}