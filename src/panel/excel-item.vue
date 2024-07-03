<template>
  <div class="item" style="">
    <div class="box">
      <CCCheckBox :value="data.isUse" @:onChange="onBtnClickUse"> {{ index + 1 }} </CCCheckBox>
    </div>
    <div class="box">{{ data.name }}</div>
    <div class="box">{{ data.sheet }}</div>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent, ref } from "vue";
import { ItemData } from "./const";
import ccui from "@xuyanfeng/cc-ui";
const { CCCheckBox } = ccui.components;
export default defineComponent({
  name: "excel-item",
  components: { CCCheckBox },
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
  color: white;
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
