<template>
  <CCSection name="配置-Excel" class="excel">
    <template v-slot:header>
      <div class="header">统计: sheet[{{ excelArray.length }}] excel[{{ excelFileArr.length }}]</div>
    </template>
    <CCProp v-show="false" name="Excel文件路径:" tooltip="插件会循环遍历出目录下所有的excel文件">
      <div class="path">
        <CCInput placeholder="请选择Excel目录" disabled v-model:value="excelRootPath" :directory="true"></CCInput>
        <CCButton color="blue" @confirm="onBtnClickSelectExcelRootPath"><i class="iconfont icon_folder"></i></CCButton>
        <CCButton v-show="excelRootPath && excelRootPath.length > 0" @confirm="onBtnClickFreshExcel">
          <i class="iconfont icon_fresh"></i>
        </CCButton>
      </div>
    </CCProp>

    <div class="excel-title">
      <div class="box">
        <CCCheckBox label="序号" @onChange="onBtnClickSelectSheet"></CCCheckBox>
      </div>
      <div class="box">Excel文件</div>
      <div class="box">工作表名称</div>
    </div>
    <div class="excel-content">
      <ExcelItem track-by="$index" v-for="(item, index) in excelArray" :data="item" :index="index"> </ExcelItem>
    </div>
  </CCSection>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, provide, nextTick } from "vue";
import PluginConfig from "../../cc-plugin.config";
import ccui from "@xuyanfeng/cc-ui";
import ExcelItem from "./excel-item.vue";
import CCP from "cc-plugin/src/ccp/entry-main";
import { appStore } from "./store";
import { ItemData } from "./const";
const { CCInput, CCButton, CCProp, CCSection, CCCheckBox } = ccui.components;
export default defineComponent({
  name: "index",
  components: { CCButton, CCInput, CCProp, CCSection, CCCheckBox, ExcelItem },
  setup() {
    const excelArray = ref<ItemData[]>([]);
    for (let i = 0; i < 10; i++) {
      excelArray.value.push({
        name: `name${i}`,
        sheet: `sheet${i}`,
        isUse: true,
      });
    }
    const excelFileArr = ref([]);
    const excelRootPath = ref("");
    return {
      excelArray,
      excelFileArr,
      excelRootPath,
      onBtnClickFreshExcel() {
        this._onAnalyzeExcelDirPath(this.excelRootPath);
      },
      onBtnClickSelectSheet(event) {
        let b = event.currentTarget.value;
        for (let k in this.excelArray) {
          this.excelArray[k].isUse = b;
        }
      },
      async onBtnClickSelectExcelRootPath() {
        const ret = await CCP.Adaptation.Dialog.select({
          title: "选择Excel的根目录",
          type: "directory",
        });
        const dirs = Object.keys(ret);
        if (!dirs.length) {
          return;
        }
        const dir = dirs[0];
        appStore().config.excel_root_path = dir;
        // TODO:
        // chokidar.watch(this.excelRootPath).on("all", this._watchDir.bind(this));
        this._onAnalyzeExcelDirPath(dir);
        appStore().save();
      },
    };
  },
});
</script>

<style scoped lang="less">
.excel {
  .header {
    color: #e5e9f2;
  }
  .path {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .excel-title {
    color: white;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 15px;
    margin-right: 18px;
    .box {
      flex: 1;
    }
  }
  .excel-content {
    display: flex;
    flex-direction: column;
  }
}
</style>
