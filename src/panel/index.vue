<template>
  <div class="panel">
    <div class="view-root ccui-scrollbar">
      <Excel></Excel>
      <ConfigJs></ConfigJs>
      <ConfigJson></ConfigJson>
      <ExportConfig></ExportConfig>
    </div>

    <div class="bottom">
      <CCButton @confirm="onBtnClickGen">生成</CCButton>
    </div>
    <CCDialog></CCDialog>
    <CCMenu></CCMenu>
    <CCFootBar :version="version"></CCFootBar>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import ExportConfig from "./export-config.vue";
import ConfigJson from "./config-json.vue";
import ConfigJs from "./config-js.vue";
import Excel from "./excel.vue";
import { appStore } from "./store";
import { existsSync, mkdirSync } from "fs";
import chokidar from "chokidar";
import CCP from "cc-plugin/src/ccp/entry-main";
import { join } from "path";
import { Msg, DirClientName, DirServerName, emitter } from "./const";
import { Gen } from "./gen";
const { CCInput, CCButton, CCProp, CCSection, CCCheckBox, CCDialog, CCMenu, CCFootBar } = ccui.components;
export default defineComponent({
  name: "index",
  components: { Excel, CCButton, CCInput, CCProp, CCSection, CCDialog, CCMenu, CCFootBar, CCCheckBox, ExportConfig, ConfigJson, ConfigJs },
  setup() {
    appStore().init();
    const version = ref(PluginConfig.manifest.version);
    return {
      version,
      onBtnClickGen() {
        emitter.emit(Msg.Gen);
      },
    };
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
  .bottom {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
