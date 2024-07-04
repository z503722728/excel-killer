<template>
  <CCSection name="配置-Json" :expand="config.expand_json" class="config-json" @change="onChangExpand">
    <template v-slot:header>
      <div class="header">
        <div class="fill"></div>
        <CCButtonGroup :items="items"></CCButtonGroup>
      </div>
    </template>
    <CCProp name="合并所有Json" align="left" tooltip="[√]勾选,所有的配置将合并为一个json文件<br>[×]未勾选,每个sheet对应一个json文件">
      <CCCheckBox v-model:value="config.json_merge"></CCCheckBox>
    </CCProp>
    <CCProp name="合并的Json配置文件名" v-show="config.json_merge">
      <CCInput v-model:value="config.json_all_cfg_file_name" placeholder="请输入json配置文件名"></CCInput>
      <CCButton v-show="isJsonAllCfgFileExist && config.json_merge" @confirm="onBtnClickJsonAllCfgFile">
        <i class="iconfont icon_folder"></i>
      </CCButton>
    </CCProp>
    <CCProp name="Json格式化" align="left" tooltip=" [√]勾选,json将格式化后保存<br>[×]未勾选,json将保存为单行文件">
      <CCCheckBox v-model:value="config.json_format"></CCCheckBox>
    </CCProp>
    <CCProp name="Json存放路径:">
      <CCInput v-model:value="config.json_save_path" disabled></CCInput>
      <CCButton color="green" @confirm="onBtnClickOpenJsonSavePath">打开</CCButton>
    </CCProp>
    <CCProp name="导入项目路径" tooltip="将生产的json配置导入到项目中">
      <CCInput readonly v-model:value="config.json_import_project_cfg_path"></CCInput>
      <CCButton @confirm="onBtnClickSelectProjectJsonCfgPath">选择</CCButton>
    </CCProp>
    <div class="import">
      <CCButton @confirm="onBtnClickImportProjectJsonCfg_Server" class="red">导入服务端配置</CCButton>
      <CCButton @confirm="onBtnClickImportProjectJsonCfg_Client" class="red">导入客户端配置</CCButton>
    </div>
  </CCSection>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import { ButtonGroupItem } from "@xuyanfeng/cc-ui/types/cc-button-group/const";
import CCP from "cc-plugin/src/ccp/entry-render";
import { storeToRefs } from "pinia";
import { appStore } from "./store";
import { existsSync } from "fs";
import { join } from "path";
import { dirClientName, dirServerName } from "./const";
import { _importJsonCfg } from "./util";
const { CCInput, CCButton, CCButtonGroup, CCProp, CCSection, CCCheckBox } = ccui.components;
export default defineComponent({
  name: "index",
  components: { CCButton, CCInput, CCProp, CCSection, CCCheckBox, CCButtonGroup },
  setup() {
    const items = ref<ButtonGroupItem[]>([
      {
        text: "qq",
        click: () => {
          // http://wpa.qq.com/pa?p=2:774177933:51
          const url = "http://wpa.qq.com/msgrd?v=3&uin=774177933&site=qq&menu=yes";
          CCP.Adaptation.Shell.openUrl(url);
        },
      },
      {
        text: "doc",
        click: () => {
          const url = "https://tidys.github.io/#/docs/excel-killer/README";
          CCP.Adaptation.Shell.openUrl(url);
        },
      },
    ]);
    const { config } = storeToRefs(appStore());
    return {
      items,
      config,
      // 打开合并的json
      onBtnClickJsonAllCfgFile() {
        let saveFileFullPath1 = join(this.jsonSavePath, dirClientName, this.jsonAllCfgFileName + ".json");
        let saveFileFullPath2 = join(this.jsonSavePath, dirServerName, this.jsonAllCfgFileName + ".json");
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
      async onBtnClickSelectProjectJsonCfgPath() {
        const ret = await CCP.Adaptation.Dialog.select({
          title: "选择项目配置存放目录",
          type: "directory",
        });
        const dirs = Object.keys(ret);
        if (dirs.length) {
          return;
        }
        const dir = dirs[0];
        appStore().config.json_import_project_cfg_path = dir;
        appStore().save();
      },
      onBtnClickOpenJsonSavePath() {
        let saveFileFullPath1 = join(this.jsonSavePath, dirClientName);
        let saveFileFullPath2 = join(this.jsonSavePath, dirServerName);
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
      onBtnClickImportProjectJsonCfg_Server() {
        _importJsonCfg("server");
      },
      onBtnClickImportProjectJsonCfg_Client() {
        _importJsonCfg("client");
      },
      onChangExpand(expand: boolean) {
        appStore().config.expand_json = !!expand;
        appStore().save();
      },
    };
  },
});
</script>

<style scoped lang="less">
.config-json {
  .fill {
    flex: 1;
  }
  .header {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
  .import {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
