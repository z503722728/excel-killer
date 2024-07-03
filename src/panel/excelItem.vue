<template>
  <div class="item" style="">
    <div class="box flex-1">
      <ui-checkbox v-bind:checked="data.isUse" @:change="onBtnClickUse">
        {{ index + 1 }}
      </ui-checkbox>
    </div>
    <div class="box">{{ data.name }}</div>
    <div class="box">{{ data.sheet }}</div>
  </div>
  <hr style="margin: 1px 0 1px 0" />
</template>

<script lang="ts">
import { PropType, defineComponent, ref } from "vue";
import { ItemData } from "./const";
export default defineComponent({
  name: "excel-item",
  props: {
    index: {
      type: Number,
      default: 0,
    },
    data: {
      type: Object as PropType<ItemData>,
      default: () => {
        return {
          name: "",
          sheet: "",
          isUse: false,
        };
      },
    },
  },
  setup(props, ctx) {
    return {
      onBtnClickUse() {
        this.data.isUse = !this.data.isUse;
        console.log("on use: " + this.data.isUse);
      },
    };
  },
});
</script>

<style scoped lang="less">
.item {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 20px;
  background-color: #252525;
  &:hover {
    background-color: #505050;
  }
  .box {
    flex: 1;
    padding: 0 5px 0 5px;
  }
}
</style>
