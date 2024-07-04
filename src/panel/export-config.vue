<template>
  <CCSection name="配置-导出">
    <CCProp name="Json格式" tooltip="">
      <CCCheckBox v-model:value="config.exportJson" @change=""> </CCCheckBox>
    </CCProp>
    <CCProp name="JavaScript格式">
      <CCCheckBox v-model:value="config.exportJs" @change=""> </CCCheckBox>
    </CCProp>
    <CCProp name="客户端*[c字段]">
      <CCCheckBox v-model:value="config.exportClient" @change=""> </CCCheckBox>
    </CCProp>
    <CCProp name="服务端*[s字段]">
      <CCCheckBox v-model:value="config.exportServer" @change=""> </CCCheckBox>
    </CCProp>
  </CCSection>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import { storeToRefs } from "pinia";
import { appStore } from "./store";
import { config } from "process";
const { CCInput, CCButton, CCProp, CCSection, CCCheckBox } = ccui.components;
export default defineComponent({
  name: "index",
  components: { CCButton, CCInput, CCProp, CCSection, CCCheckBox },
  setup() {
    const { config } = storeToRefs(appStore());
    return { config };
  },
});
</script>

<style scoped lang="less"></style>
