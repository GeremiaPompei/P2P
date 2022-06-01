export default {
    template: /*html*/ `
    <div class="container">
        <div class="text-center">
          <h1>TRY</h1>
        </div>
        <div class="row">
          <div class="col d-flex align-items-center justify-content-center">
          <div class="btn btn-primary" type="submit" @click="() => $emit('setRole', 'manager')">
            Manager
          </div>
          </div>
          <div class="col d-flex align-items-center justify-content-center">
            <div class="btn btn-primary" type="submit" @click="() => $emit('setRole', 'user')">
              User
            </div>
          </div>
        </div>
    </div>
      `,
  };