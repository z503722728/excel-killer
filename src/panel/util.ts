import CCP from "cc-plugin/src/ccp/entry-main";
import { existsSync } from "fs";
import { join } from "path";

export function _importJsonCfg(typeDir) {
  if (!existsSync(this.importProjectCfgPath)) {
    this._addLog("导入项目路径不存在:" + this.importProjectCfgPath);
    return;
  }

  if (!this.isExportJson) {
    this._addLog("[Warning] 您未勾选导出Json配置,可能导入的配置时上个版本的!");
  }

  let importPath = CCP.Adaptation.Util.fspathToUrl(this.importProjectCfgPath);
  if (importPath.indexOf("db://assets") >= 0) {
    // 检索所有的json配置
    let clientDir = join(this.jsonSavePath, typeDir);
    if (!existsSync(clientDir)) {
      this._addLog("配置目录不存在:" + clientDir);
      return;
    }
    let pattern = join(clientDir, "**/*.json");
    let files = Globby.sync(pattern);
    this._addLog("一共导入文件数量: " + files.length);
    for (let i = 0; i < files.length; i++) {}
    Editor.assetdb.import(files, importPath, (err, results) => {
      results.forEach(function (result) {
        console.log(result.path);
        // result.uuid
        // result.parentUuid
        // result.url
        // result.path
        // result.type
      });
    });
  } else {
    throw new Error("非项目路径,无法导入 : " + this.importProjectCfgPath);
  }
}
