export default {
  template: /*html*/ `
    <div v-if="notification.show" class="alert_overlay">
        <div class="alert" :class="[notification.flag ? 'alert-success' : 'alert-danger']" role="alert">
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
