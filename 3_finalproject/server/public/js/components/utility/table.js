export default {
    template:
      /*html*/
      `<div class="p-4 table-responsive table-wrapper-scroll-y" style="max-height: 600px;">
          <h5 v-if="title.length > 0">{{title}}</h5>
                      <table v-if="data.length > 0" class="table table-striped text-center">
                          <thead v-if="!notitle">
                              <tr>
                                  <th scope="col" v-for="(field, k) in fields" :key="k">
                                      {{field.title}}
                                  </th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr v-for="(obj, o) in data" :key="o">
                                  <td scope="col" v-for="(field, k) in fields" :key="k">
                                      <div v-if="field.type=='composed'">{{field.mapping(obj)}}</div>
                                      <a v-else-if="field.type=='url'" target="_blank" :href="obj[field.value]">{{field.label}}</a>
                                      <img v-else-if="field.type=='img'" :src="obj[field.value]" width="200" height="200">
                                      <div v-else-if="field.type=='text'">{{obj[field.value]}}</div>
                                      <div v-else-if="field.type=='date'">{{new Date(obj[field.value]).toLocaleDateString()}}</div>
                                      <div v-else-if="field.type=='button'" class="btn btn-success" 
                                          @click="() => {
                                              field.select(obj);
                                              defaultClose();
                                          }"
                                      >{{obj[field.value]}}</div>
                                      <div v-else-if="field.type=='button_label'" class="btn btn-success" 
                                          @click="() => {
                                              field.select(obj);
                                              defaultClose();
                                          }"
                                      >{{field.value}}</div>
                                      <div v-else>{{field.value}}</div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                      <div v-else>Empty</div>
                  </div>
                  `,
    props: {
        title: {
            type: String,
            default: ""
        },
      data: Array,
      fields: Array,
      notitle: Boolean,
      defaultClose: {
          type: Function,
          default: () => {}
      }
    },
  };
  