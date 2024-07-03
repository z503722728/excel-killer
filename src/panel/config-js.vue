<template>
  <CCSection name="配置-JavaScript">
    <CCProp name="Js存放路径:">
      <CCInput v-model:value="config.js_save_path" disabled></CCInput>
      <CCButton color="green" @confirm="onBtnClickOpenJsSavePath"><i class="iconfont icon_folder"></i></CCButton>
    </CCProp>
    <CCProp name="合并所有Js" align="left" tooltip="[√]勾选,所有的配置将合并为一个js文件<br>[×]未勾选,每个sheet对应一个js文件">
      <CCCheckBox v-model:value="config.js_merge"></CCCheckBox>
    </CCProp>
    <CCProp name="javaScript文件名" v-show="config.js_merge">
      <CCInput v-model:value="config.js_file_name" placeholder="请输入javaScript文件名"></CCInput>
      <CCButton @confirm="onBtnClickOpenJsFile" v-show="isJsFileExist && config.js_merge">
        <i class="iconfont icon_folder"></i>
      </CCButton>
    </CCProp>
    <CCProp name="代码格式化" align="left" tooltip="[√]勾选,js将格式化后保存文件<br>[×]未勾选,js将保存为单行文件">
      <CCCheckBox v-model:value="config.js_format"></CCCheckBox>
    </CCProp>
  </CCSection>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import { storeToRefs } from "pinia";
import { appStore } from "./store";
import { existsSync } from "fs";
import { join } from "path";
import CCP from "cc-plugin/src/ccp/entry-render";
import { dirClientName, dirServerName } from "./const";
const { CCInput, CCButton, CCProp, CCSection, CCCheckBox } = ccui.components;
export default defineComponent({
  name: "index",
  components: { CCButton, CCInput, CCProp, CCSection, CCCheckBox },
  setup() {
    const { config } = storeToRefs(appStore());
    return {
      config,
      // 打开生成的js配置文件
      onBtnClickOpenJsFile() {
        let saveFileFullPath1 = join(this.jsSavePath, dirClientName, this.jsFileName + ".js");
        let saveFileFullPath2 = join(this.jsSavePath, dirServerName, this.jsFileName + ".js");
        if (existsSync(saveFileFullPath1)) {
          CCP.Adaptation.Dialog.open(saveFileFullPath1);
        } else if (existsSync(saveFileFullPath2)) {
          CCP.Adaptation.Dialog.open(saveFileFullPath2);
        } else {
          // this._addLog("目录不存在：" + this.resourceRootDir);
          this._addLog("目录不存在:" + saveFileFullPath1 + " or:" + saveFileFullPath2);
        }
      },
      onBtnClickOpenJsSavePath() {
        let saveFileFullPath1 = join(this.jsSavePath, dirClientName);
        let saveFileFullPath2 = join(this.jsSavePath, dirServerName);
        if (existsSync(saveFileFullPath1)) {
          CCP.Adaptation.Dialog.open(saveFileFullPath1);
        } else if (existsSync(saveFileFullPath2)) {
          CCP.Adaptation.Dialog.open(saveFileFullPath2);
        } else {
          // this._addLog("目录不存在：" + this.resourceRootDir);
          this._addLog("目录不存在:" + saveFileFullPath1 + " or:" + saveFileFullPath2);
          return;
        }
      },
    };
  },
});
</script>

<style scoped lang="less"></style>
