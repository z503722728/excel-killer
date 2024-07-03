<template>
  <div class="panel">
    <div class="view-root ccui-scrollbar">
      <ConfigJs></ConfigJs>
      <!-- <ConfigJson></ConfigJson> -->
      <!-- <ExportConfig></ExportConfig> -->
    </div>

    <div class="layout horizontal center justified">
      <CCButton @confirm="onBtnClickGen">生成</CCButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import ExportConfig from "./export-config.vue";
import ConfigJson from "./config-json.vue";
import ConfigJs from "./config-js.vue";
const { CCInput, CCButton, CCProp, CCSection, CCCheckBox } = ccui.components;
export default defineComponent({
  name: "index",
  components: { CCButton, CCInput, CCProp, CCSection, CCCheckBox, ExportConfig, ConfigJson, ConfigJs },
  setup() {
    const logView = ref("");
    return { logView, onBtnClickGen() {} };
  },
});
</script>

<style scoped lang="less">
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  .view-root {
    flex: 1;
    padding: 10px;
    padding-top: 0px;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
