import { emptyDirSync, existsSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { ConfigData, DirClientName, DirServerName, ItemData } from "./const";
import nodeXlsx from "node-xlsx";
import CCP from "cc-plugin/src/ccp/entry-render";
import { appStore } from "./store";
export class Gen {
  private isJsFileExist: boolean = false;
  private isMergeJson: boolean = false;
  private isFormatJsCode: boolean = false;
  private jsonAllCfgFileName: string = "";
  private jsFileName: string = "";
  private isExportServer: boolean = false;
  private isExportClient: boolean = false;
  private isExportJson: boolean = false;
  private jsSavePath: string = "";
  private jsonSavePath: string = "";
  private isExportJs: boolean = false;
  private isMergeJavaScript: boolean = false;
  private _addLog(log: string) {
    throw new Error(log);
  }
  public ready(cfg: ConfigData) {
    this.isMergeJson = cfg.json_merge;
    this.jsonAllCfgFileName = cfg.json_all_cfg_file_name;

    this.isMergeJavaScript = cfg.js_merge;
    this.jsFileName = cfg.js_file_name;

    this.isExportServer = cfg.exportServer;
    this.isExportClient = cfg.exportClient;

    this.isExportJson = cfg.exportJson;
    this.isExportJs = cfg.exportJs;

    this.jsSavePath = cfg.js_save_path;
    this.jsonSavePath = cfg.json_save_path;

    this.isFormatJsCode = cfg.js_format;
    this.isFormatJson = cfg.json_format;
  }
  public check() {
    if (CCP.Adaptation.Env.isPlugin) {
      if (!this.jsSavePath || !existsSync(this.jsSavePath)) {
        throw new Error(`invalid js save path: ${this.jsSavePath}`);
      }

      if (!this.jsonSavePath || !existsSync(this.jsonSavePath)) {
        throw new Error(`invalid json save path: ${this.jsonSavePath}`);
      }
    }

    if (this.isMergeJson) {
      if (!this.jsonAllCfgFileName || this.jsonAllCfgFileName.length <= 0) {
        throw new Error("请输入要保存的json文件名!");
      }
    }
    if (this.isMergeJavaScript) {
      if (!this.jsFileName || this.jsFileName.length <= 0) {
        throw new Error("请输入要保存的js文件名!");
      }
    }
    if (this.isExportServer === false && this.isExportClient === false) {
      throw new Error("请选择要导出的目标!");
    }

    if (this.isExportJson === false && this.isExportJs === false) {
      throw new Error("请选择要导出的类型!");
    }
  }
  private jsonAllClientData = {}; // 保存客户端的json数据
  private jsonAllServerData = {}; // 保存服务端的json数据
  private jsAllClientData = {}; // 保存客户端的js数据
  private jsAllServerData = {}; // 保存服务端的js数据
  doWork(data: ItemData[]) {
    debugger;
    // 删除老的配置
    const jsonClient = join(this.jsonSavePath, DirClientName);
    const jsonServer = join(this.jsonSavePath, DirServerName);
    const jsClient = join(this.jsSavePath, DirClientName);
    const jsServer = join(this.jsSavePath, DirServerName);
    if (CCP.Adaptation.Env.isPlugin) {
      emptyDirSync(jsonClient);
      emptyDirSync(jsonServer);
      emptyDirSync(jsClient);
      emptyDirSync(jsServer);
    }

    for (let k = 0; k < data.length; k++) {
      const itemSheet = data[k];
      if (!itemSheet.isUse) {
        console.log(`ignore sheet: ${itemSheet.sheet} in ${itemSheet.fullPath}`);
        continue;
      }

      const sheetData = itemSheet.buffer;
      if (!sheetData) {
        throw new Error(`not find any data in sheet: ${itemSheet.sheet}`);
      }

      if (sheetData.length <= 3) {
        throw new Error(`row count less than 3, invalid sheet: ${itemSheet.sheet}`);
      }
      this.parseJsonData(itemSheet);
      this.parseJavaScriptData(itemSheet);
    }
    // this.saveJson(itemSheet, jsonClient, true);

    // =====================>>>>  合并json文件   <<<=================================
    if (this.isExportJson && this.isMergeJson) {
      if (this.isExportClient) {
        const saveFileFullPath = join(jsonClient, this.jsonAllCfgFileName + ".json");
        this._onSaveJsonCfgFile(this.jsonAllClientData, saveFileFullPath);
      }
      if (this.isExportServer) {
        const saveFileFullPath = join(jsonServer, this.jsonAllCfgFileName + ".json");
        this._onSaveJsonCfgFile(this.jsonAllServerData, saveFileFullPath);
      }
      this.checkJsonAllCfgFileExist();
    }
    // =====================>>>>  合并js文件   <<<=================================
    if (this.isExportJs && this.isMergeJavaScript) {
      if (this.isExportClient) {
        this._onSaveJavaScriptCfgFile(join(jsClient, this.jsFileName + ".js"), this.jsAllClientData);
      }
      if (this.isExportServer) {
        this._onSaveJavaScriptCfgFile(join(jsServer, this.jsFileName + ".js"), this.jsAllServerData);
      }

      this.checkJsFileExist();
    }

    return;
  }
  private saveJson(itemSheet: ItemData, dir: string, isClient: boolean) {
    const { sheet, name } = itemSheet;
    const saveFileFullPath = join(dir, sheet + ".json");
    if (this.isMergeJson) {
      const data = isClient ? this.jsonAllClientData : this.jsonAllServerData;
      this._onSaveJsonCfgFile(data, saveFileFullPath);
    } else {
      if (isClient) {
        for (const key in this.jsonAllClientData) {
          const data = this.jsonAllClientData[key];
          this._onSaveJsonCfgFile(data, saveFileFullPath);
        }
      } else {
        for (const key in this.jsonAllServerData) {
          const data = this.jsonAllServerData[key];
          this._onSaveJsonCfgFile(data, saveFileFullPath);
        }
      }
    }
  }
  private flushData(sheet: string, all: any, data: any) {
    if (Object.keys(data).length > 0) {
      if (all[sheet] === undefined) {
        all[sheet] = data;
      } else {
        this._addLog("发现重名sheet:" + name + "(" + sheet + ")");
      }
    }
  }
  private parseJsonData(itemSheet: ItemData) {
    const { sheet, name } = itemSheet;
    const { client, server } = this.splitData(itemSheet);
    this.flushData(sheet, this.jsonAllClientData, client);
    this.flushData(sheet, this.jsonAllServerData, server);
  }
  private parseJavaScriptData(itemSheet: ItemData) {
    let savePath, isClient;
    // const sheetJsData = this._getJavaScriptSaveData(sheetData, itemSheet, isClient);
    // if (Object.keys(sheetJsData).length > 0) {
    //   if (this.isMergeJavaScript) {
    //     if (isClient) {
    //       // 检测重复问题
    //       if (jsAllSaveDataClient[itemSheet.sheet] === undefined) {
    //         jsAllSaveDataClient[itemSheet.sheet] = sheetJsData;
    //       } else {
    //         this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
    //       }
    //     } else {
    //       // 检测重复问题
    //       if (jsAllSaveDataServer[itemSheet.sheet] === undefined) {
    //         jsAllSaveDataServer[itemSheet.sheet] = sheetJsData;
    //       } else {
    //         this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
    //       }
    //     }
    //   } else {
    //     // 保存js配置
    //     const fileNameFullPath = join(savePath, itemSheet.sheet + ".js");
    //     this._onSaveJavaScriptCfgFile(fileNameFullPath, sheetJsData);
    //   }
    // }
  }
  private isServerField(str: string) {
    return str.indexOf("s") !== -1;
  }
  private isClientField(str: string) {
    return str.indexOf("c") !== -1;
  }
  private splitData(itemSheet: ItemData): { server: any; client: any } {
    const excelData: any[][] = itemSheet.buffer;
    const title = excelData[0];
    const desc = excelData[1];
    /**
     * 是客户端还是服务器
     */
    const target = excelData[2];
    const ruleText = excelData[3];
    const ret = { server: {}, client: {} };
    const useFormat1 = false;
    if (useFormat1) {
      const saveData1 = []; // 格式1:对应的为数组
      for (let i = 4; i < excelData.length; i++) {
        const lineData = excelData[i];
        if (lineData.length < title.length) {
          continue;
        } else if (lineData.length > title.length) {
          continue;
        }

        const saveLineData = {};
        let canExport = false;
        for (let j = 0; j < title.length; j++) {
          canExport = false;
          if (isClient && target[j].indexOf("c") !== -1) {
            canExport = true;
          } else if (!isClient && target[j].indexOf("s") !== -1) {
            canExport = true;
          }

          if (canExport) {
            const key = title[j];

            const rule = ruleText[j].trim();
            if (key === "Empty" || rule === "Empty") {
              continue;
            }

            let value = lineData[j];
            if (value === undefined) {
              value = "";
            }

            if (value) {
              value = this.cutString(rule, value);
            }

            // this._addLog("" + value);
            saveLineData[key] = value;
          }
        }

        canExport = false;
        if (isClient && target[0].indexOf("c") !== -1) {
          canExport = true;
        } else if (!isClient && target[0].indexOf("s") !== -1) {
          canExport = true;
        }
        if (canExport) {
          saveData1.push(saveLineData);
        }
      }
      ret = saveData1;
    } else {
      const saveData2 = {}; // 格式2:id作为索引
      for (let line = 4; line < excelData.length; line++) {
        const lineData = excelData[line];
        const id = lineData[0];
        if (lineData.length !== title.length) {
          this._addLog(`配置表头和配置数据不匹配:${itemSheet.name} - ${itemSheet.sheet} : 第${line + 1}行`);
          this._addLog("跳过该行数据");
          continue;
        }

        const saveLineData = { server: {}, client: {} };
        // todo 将ID字段也加入到data中
        for (let idx = 0; idx < title.length; idx++) {
          const key = title[idx];
          const rule = ruleText[idx].trim();
          if (key === "Empty" || rule === "Empty") {
            continue;
          }

          let value = lineData[idx] || "";
          if (value) {
            // value = this.cutString(rule, value);
          }
          if (this.isClientField(target[idx])) {
            saveLineData.client[key] = value;
          }
          if (this.isServerField(target[idx])) {
            saveLineData.server[key] = value;
          }
        }
        ret.server[id] = saveLineData.server;
        ret.client[id] = saveLineData.client;
      }
    }
    return ret;
  }
  // 保存为json配置
  _onSaveJsonCfgFile(data, saveFileFullPath) {
    let str = "";
    if (this.isFormatJson) {
      str = JSON.stringify(data, null, "\t");
    } else {
      str = JSON.stringify(data);
    }
    writeFileSync(saveFileFullPath, str);
    this._addLog("[Json]:" + saveFileFullPath);
  }
  _getJavaScriptSaveData(excelData, itemSheet, isClient) {
    const title = excelData[0];
    const desc = excelData[1];
    const target = excelData[2];
    const ruleText = excelData[3];
    const sheetFormatData = {};
    for (let i = 4; i < excelData.length; i++) {
      const lineData = excelData[i];
      if (lineData.length === 0) {
        // 空行直接跳过
        continue;
      } else {
        if (lineData.length < title.length) {
          this._addLog("[Error] 发现第" + i + "行缺少字段,跳过该行数据配置.");
          continue;
        } else if (lineData.length > title.length) {
          this._addLog("[Error] 发现第" + i + "行多余字段,跳过该行数据配置.");
          continue;
        }
      }
      const saveLineData = {};
      let canExport = false;
      for (let j = 1; j < title.length; j++) {
        canExport = false;
        if (isClient && target[j].indexOf("c") !== -1) {
          canExport = true;
        } else if (!isClient && target[j].indexOf("s") !== -1) {
          canExport = true;
        }

        if (canExport) {
          const key = title[j];
          let rule = "";

          if (typeof ruleText[j] === "string") {
            rule = ruleText[j].trim();
          } else {
            this._addLog(`[exception] ${j + 1}列规则文本异常，请检查`);
            continue;
          }

          if (key === "Empty" || rule === "Empty") {
            continue;
          }

          let value = lineData[j];
          if (value === undefined) {
            value = "";
            this._addLog("[Error] 发现空单元格:" + itemSheet.name + "*" + itemSheet.sheet + " => (" + key + "," + (i + 1) + ")");
          }

          if (value) {
            value = this.cutString(rule, value);
          }

          saveLineData[key] = value;
        }
      }

      canExport = false;
      if (isClient && target[0].indexOf("c") !== -1) {
        canExport = true;
      } else if (!isClient && target[0].indexOf("s") !== -1) {
        canExport = true;
      }
      if (canExport) {
        sheetFormatData[lineData[0].toString()] = saveLineData;
      }
    }
    return sheetFormatData;
  }
  /**
   * 切割字符串数据
   * @param {string} rule 规则字符串
   * @param {string} text 数据字符串
   */
  cutString(rule, text: string) {
    let result = null;

    if (typeof text == "string") {
      text = text.trim();
      text = text.replace(/\n|\r/g, "");

      if (text[text.length - 1].search(/;|,/) != -1) {
        text = text.slice(0, text.length - 1);
      } else if (text[0].search(/;|,/) != -1) {
        text = text.slice(1, text.length);
      }
    }

    // {1,2};{3,4}
    // {1,[2;3]};{4,[5,6]}
    // {1,2,[String;String]};{3,4,[String;String]}
    // {1,2,String};{3,4,String}
    if (rule.search(/Array\[Object\{[a-zA-Z0-9\[\]:,"]*\}\]/) != -1) {
      result = [];

      // 替换数据中的字符串为 “String” 形式
      if (rule.search(/String/) != -1) {
        const stringData = text.match(/[^(\[|\]|;|:)|\{|\}|,]+/g);
        const noneDuplicates = [];
        const noNumberReg = /^\d+(\.\d+)?$/;
        for (const value of stringData) {
          if (!noNumberReg.test(value)) {
            noneDuplicates.push(value);
          }
        }

        for (const value of noneDuplicates) {
          const notHead = text.search(eval(`/^[${value}]/`)) == -1;
          const searchReg = new RegExp(notHead ? `[^(")]${value}{1}[;|\\]|,|}]` : `^${value}{1}[;|\\]|,|}]`);
          let index = text.search(searchReg);

          if (index != -1) {
            index = index + (notHead ? 1 : 0);
            text = text.slice(0, index) + `"${value}"` + text.slice(index + value.length, text.length);
          }
        }
      }

      let array = null;
      const insideResult = rule.match(/Object\{[a-zA-Z0-9\[\]:,"]*\}/);

      if (insideResult[0].indexOf("Array") == -1) {
        const textArray = text.split(";");
        array = [];
        for (const item of textArray) {
          array.push(`{${item}}`);
        }
      } else {
        array = text.match(/{[^({|})]*}/g);
      }

      const dataArray = [];
      array.forEach((item) => {
        let element = item.replace(/\{/g, "[");
        element = element.replace(/\}/g, "]");
        element = element.replace(/;/g, ",");
        element = JSON.parse(element);

        dataArray.push(element);
      });

      const keys = [];
      const reg = /"([a-zA-Z0-9]*)":/g;
      let test = reg.exec(rule);

      while (test) {
        const key = test[0].replace(/(:|\")/g, "");
        keys.push(key);

        test = reg.exec(rule);
      }

      for (let i = 0; i < dataArray.length; ++i) {
        const obj = {};
        const data = dataArray[i];

        let index = 0;
        for (const key of keys) {
          obj[key] = data[index];
          index++;
        }

        result.push(obj);
      }
    }
    // [1;2];[3;4]
    // [1;2]
    else if (rule.search(/Array\[Array\[Number\]\]/) === 0 || rule.search(/Array\[Number\]/) === 0) {
      let str = `[${text}]`;
      str = str.replace(/;/g, ",");
      result = JSON.parse(str);
    }
    // String;String
    else if (rule.search(/Array\[String\]/) === 0) {
      let newText = "";

      const textArray = text.match(/[^(\[|\]|;)]+/g);
      let index = 0;
      const edge = textArray.length;

      for (const subString of textArray) {
        newText = `${newText}"${subString}"`;
        index++;

        if (index == edge) {
          break;
        }

        newText += ",";
      }

      newText = `[${newText}]`;
      newText = newText.replace(/;/g, ",");

      try {
        result = JSON.parse(newText);
      } catch (exception) {
        debugger;
      }
    }
    // [String;String];[String;String]
    else if (rule.search(/Array\[Array\[String\]\]/) === 0) {
      result = [];

      const array = text.match(/\[[^(\[|\])]*\]/g);

      for (const item of array) {
        const textArray = item.match(/[^(\[|\]|;)]+/g);
        let newText = "";
        let index = 0;
        const edge = textArray.length - 1;
        for (const subString of textArray) {
          newText = `${newText}"${subString}"`;
          index++;

          if (index == edge) {
            break;
          }

          newText += ",";
        }

        newText = `[${newText}]`;

        const json = JSON.parse(newText);
        result.push(json);
      }
    } else if (rule.search(/Object\{[a-zA-Z0-9\[\]:,"]*\}/) === 0) {
      result = {};

      if (rule.search(/String/) != -1) {
        const stringData = text.match(/[^(\[|\]|;|:)|\{|\}|,]+/g);
        const noneDuplicates = [];
        const noNumberReg = /^\d+(\.\d+)?$/;
        for (const value of stringData) {
          if (!noNumberReg.test(value)) {
            noneDuplicates.push(value);
          }
        }

        for (const value of noneDuplicates) {
          const notHead = text.search(eval(`/^[${value}]/`)) == -1;
          const searchReg = new RegExp(notHead ? `[^(")]${value}{1}[;|\\]|,|}]` : `^${value}{1}[;|\\]|,|}]`);
          let index = text.search(searchReg);

          if (index != -1) {
            index = index + (notHead ? 1 : 0);
            text = text.slice(0, index) + `"${value}"` + text.slice(index + value.length, text.length);
          }
        }
      }

      const keys = [];
      const reg = /"([a-zA-Z0-9]*)":/g;
      let test = reg.exec(rule);

      while (test) {
        const key = test[0].replace(/(:|\")/g, "");
        keys.push(key);

        test = reg.exec(rule);
      }

      let str = `[${text}]`;
      str = str.replace(/;/g, ",");

      let json = null;
      try {
        json = JSON.parse(str);
      } catch (e) {
        debugger;
      }

      let index = 0;
      for (const key of keys) {
        result[key] = json[index];
        index++;
      }
    }
    // 1
    else if (rule.search("Number") === 0) {
      result = Number(text);
    }
    // String
    else if (rule.search("String") === 0) {
      result = text;
    }

    return result;
  }
  private isFormatJson: boolean = false;
  checkJsonAllCfgFileExist() {
    const saveFileFullPath1 = join(this.jsonSavePath, DirClientName, this.jsonAllCfgFileName + ".json");
    const saveFileFullPath2 = join(this.jsonSavePath, DirServerName, this.jsonAllCfgFileName + ".json");
    if (existsSync(saveFileFullPath1) || existsSync(saveFileFullPath2)) {
      this.isJsonAllCfgFileExist = true;
    } else {
      this.isJsonAllCfgFileExist = false;
    }
  }
  private isJsonAllCfgFileExist: boolean = false;
  // 保存为js配置
  _onSaveJavaScriptCfgFile(saveFileFullPath, jsSaveData) {
    // TODO 保证key的顺序一致性
    let saveStr = "module.exports = ";
    if (this.isFormatJsCode) {
      // 保存为格式化代码
      saveStr = saveStr + JSON.stringify(jsSaveData, null, "\t") + ";";
    } else {
      // 保存为单行代码
      saveStr = saveStr + JSON.stringify(jsSaveData) + ";";
    }

    writeFileSync(saveFileFullPath, saveStr);
    this._addLog("[JavaScript]" + saveFileFullPath);
  }
  // 检测js配置文件是否存在
  checkJsFileExist() {
    const saveFileFullPath1 = join(this.jsSavePath, DirClientName, this.jsFileName + ".js");
    const saveFileFullPath2 = join(this.jsSavePath, DirServerName, this.jsFileName + ".js");
    if (existsSync(saveFileFullPath1) || existsSync(saveFileFullPath2)) {
      this.isJsFileExist = true;
    } else {
      this.isJsFileExist = false;
    }
  }
}
