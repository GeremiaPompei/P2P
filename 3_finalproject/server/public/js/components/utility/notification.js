export default {
  template: /*html*/ `
    <div v-if="notification.show" class="alert_overlay">
        <div class="alert" :class="[notification.flag ? 'alert-success' : 'alert-danger']" role="alert">
          <button type="button" class="close close-popup" data-dismiss="alert" aria-label="Close" @click="() => notification.show = false">
              <span aria-hidden="true">&times;</span>
          </button>
          <p class="font-weight-bold">{{notification.title}} </p>{{notification.description}}
        </div>
  </div>`,
  props: {
    notification: Object,
    timer: {
      type: Number,
      default: 3000,
    },
  },
  data() {
    return {
      show: true,
    };
  },
  watch: {
    notification(newNotification, oldNotification) {
      if (!oldNotification.show && newNotification.show)
        setTimeout(this.close, this.timer);
    },
  },
  methods: {
    close() {
      this.notification.show = false;
    },
  },
};
