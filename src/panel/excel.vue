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
import { readdirSync, statSync } from "fs";
import { extname, join } from "path";
import nodeXlsx from "node-xlsx";
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
    // 查找出目录下的所有excel文件
    function _onAnalyzeExcelDirPath(dir: string) {
      let self = this;

      if (dir) {
        // 查找json文件
        let allFileArr = [];
        let excelFileArr = [];
        // 获取目录下所有的文件
        readDirSync(dir);
        // 过滤出来.xlsx的文件
        for (let k in allFileArr) {
          let file = allFileArr[k];
          let extName = extname(file);
          if (extName === ".xlsx" || extName === ".xls") {
            excelFileArr.push(file);
          } else {
            this._addLog("不支持的文件类型: " + file);
          }
        }

        this.excelFileArr = excelFileArr;
        // 组装显示的数据
        let excelSheetArray = [];
        let sheetDuplicationChecker = {}; //表单重名检测
        for (let k in excelFileArr) {
          let itemFullPath = excelFileArr[k];
          // this._addLog("excel : " + itemFullPath);

          let excelData = nodeXlsx.parse(itemFullPath);
          //todo 检测重名的sheet
          for (let j in excelData) {
            let itemData = {
              isUse: true,
              fullPath: itemFullPath,
              name: "name",
              sheet: excelData[j].name,
            };
            itemData.name = itemFullPath.substr(dir.length + 1, itemFullPath.length - dir.length);

            if (excelData[j].data.length === 0) {
              this._addLog("[Error] 空Sheet: " + itemData.name + " - " + itemData.sheet);
              continue;
            }

            if (sheetDuplicationChecker[itemData.sheet]) {
              //  重名sheet问题
              this._addLog("[Error ] 出现了重名sheet: " + itemData.sheet);
              this._addLog("[Sheet1] " + sheetDuplicationChecker[itemData.sheet].fullPath);
              this._addLog("[Sheet2] " + itemFullPath);
              this._addLog("请仔细检查Excel-Sheet!");
            } else {
              sheetDuplicationChecker[itemData.sheet] = itemData;
              excelSheetArray.push(itemData);
            }
          }
        }
        this.excelArray = excelSheetArray;

        function readDirSync(dirPath) {
          let dirInfo = readdirSync(dirPath);
          for (let i = 0; i < dirInfo.length; i++) {
            let item = dirInfo[i];
            let itemFullPath = join(dirPath, item);
            let info = statSync(itemFullPath);
            if (info.isDirectory()) {
              // this._addLog('dir: ' + itemFullPath);
              readDirSync(itemFullPath);
            } else if (info.isFile()) {
              let headStr = item.substr(0, 2);
              if (headStr === "~$") {
                self._addLog("检索到excel产生的临时文件:" + itemFullPath);
              } else {
                allFileArr.push(itemFullPath);
              }
              // this._addLog('file: ' + itemFullPath);
            }
          }
        }
      }
    }

    function _watchDir(event, filePath) {
      return;
      console.log("监控文件....");
      console.log(event, filePath);
      let ext = extname(filePath);
      if (ext === ".xlsx" || ext === ".xls") {
        this._onAnalyzeExcelDirPath(this.excelRootPath);
      }
    }
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
        _onAnalyzeExcelDirPath(dir);
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
