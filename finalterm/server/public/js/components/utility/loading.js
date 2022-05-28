export default {
  template: /*html*/ `
    <div v-if="loading" class="loading_container">
      <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
      </div>
  </div>
    `,
  props: {
    loading: Boolean,
  },
};
