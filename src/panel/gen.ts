import { emptyDirSync, existsSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { ConfigData, DirClientName, DirServerName, ItemData } from "./const";
import CCP from "cc-plugin/src/ccp/entry-render";
import jszip from "jszip";
export class Gen {
  private isMergeJson: boolean = false;
  private isFormatJson: boolean = false;
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
  /**
   * 保存客户端的json数据
   */
  private jsonAllClientData = {};
  /**
   * 保存服务端的json数据
   * @example
   * ```json
   * {
   *  "sheet-name": {
   *    "id": { id:"id", property:"property" }
   *  }
   * }
   * ```
   */
  private jsonAllServerData = {};

  async doWork(data: ItemData[]): Promise<void> {
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
      this.parseExcelData(itemSheet);
    }
    let zip: null | jszip = null;
    if (CCP.Adaptation.Env.isWeb) {
      zip = new jszip();
    }
    this.exportJson(zip);
    this.exportJavaScript(zip);
    if (CCP.Adaptation.Env.isWeb) {
      const content = await zip.generateAsync({ type: "blob" });
      const filename = "excel.zip";
      await CCP.Adaptation.Download.downloadBlobFile(filename, content);
    }
    return;
  }
  private exportJson(zip: null | jszip) {
    if (!this.isExportJson) {
      return;
    }
    if (this.isMergeJson) {
      if (this.isExportClient) {
        const fullPath = join(this.jsonSavePath, DirClientName, `${this.jsonAllCfgFileName}.json`);
        this.saveJsonFile(this.jsonAllClientData, fullPath, zip);
      }
      if (this.isExportServer) {
        const fullPath = join(this.jsonSavePath, DirServerName, `${this.jsonAllCfgFileName}.json`);
        this.saveJsonFile(this.jsonAllServerData, fullPath, zip);
      }
    } else {
      if (this.isExportClient) {
        for (const key in this.jsonAllClientData) {
          const fullPath = join(this.jsonSavePath, DirClientName, `${key}.json`);
          const data = this.jsonAllClientData[key];
          this.saveJsonFile(data, fullPath, zip);
        }
      }
      if (this.isExportServer) {
        for (const key in this.jsonAllServerData) {
          const data = this.jsonAllServerData[key];
          const fullPath = join(this.jsonSavePath, DirServerName, `${key}.json`);
          this.saveJsonFile(data, fullPath, zip);
        }
      }
    }
  }
  private exportJavaScript(zip: null | jszip) {
    if (!this.isExportJs) {
      return;
    }
    if (this.isMergeJavaScript) {
      if (this.isExportClient) {
        const fullPath = join(this.jsSavePath, DirClientName, `${this.jsFileName}.js`);
        this.saveJavaScriptFile(fullPath, this.jsonAllClientData, zip);
      }
      if (this.isExportServer) {
        const fullPath = join(this.jsSavePath, DirServerName, `${this.jsFileName}.js`);
        this.saveJavaScriptFile(fullPath, this.jsonAllServerData, zip);
      }
    } else {
      if (this.isExportClient) {
        for (const key in this.jsonAllClientData) {
          const data = this.jsonAllClientData[key];
          const fullPath = join(this.jsSavePath, DirClientName, `${key}.js`);
          this.saveJavaScriptFile(fullPath, data, zip);
        }
      }
      if (this.isExportServer) {
        for (const key in this.jsonAllServerData) {
          const data = this.jsonAllServerData[key];
          const fullPath = join(this.jsSavePath, DirServerName, `${key}.js`);
          this.saveJavaScriptFile(fullPath, data, zip);
        }
      }
    }
  }

  private flushExcelData(itemSheet: ItemData, all: any, data: any) {
    const { sheet, name } = itemSheet;
    if (Object.keys(data).length > 0) {
      if (all[sheet] === undefined) {
        all[sheet] = data;
      } else {
        throw new Error(`发现重名sheet: ${name}:${sheet}`);
      }
    }
  }
  private parseExcelData(itemSheet: ItemData) {
    const { client, server } = this.splitData(itemSheet);
    this.flushExcelData(itemSheet, this.jsonAllClientData, client);
    this.flushExcelData(itemSheet, this.jsonAllServerData, server);
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

    for (let line = 4; line < excelData.length; line++) {
      const lineData = excelData[line];
      const id = lineData[0];
      if (!lineData.length) {
        // skip empty line
        continue;
      }
      if (lineData.length < title.length) {
        throw new Error(`配置数据缺失:${itemSheet.name}:${itemSheet.sheet}:${line + 1}`);
      }

      const saveLineData = { server: {}, client: {} };
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
    return ret;
  }
  saveJsonFile(data: any, path: string, zip: null | jszip) {
    const str = JSON.stringify(data, null, this.isFormatJson ? 2 : 0);
    writeFileSync(path, str);
    console.log("[Json]:" + path);
    zip && zip.file(path, str);
    return str;
  }
  saveJavaScriptFile(path: string, data: any, zip: null | jszip) {
    const str = "module.exports =" + JSON.stringify(data, null, this.isFormatJsCode ? 2 : 0) + ";";
    writeFileSync(path, str);
    console.log("[JavaScript]" + path);
    zip && zip.file(path, str);
    return str;
  }
  /**
   * 切割字符串数据
   * @param {string} rule 规则字符串
   * @param {string} text 数据字符串
   */
  cutString(rule: string, text: string) {
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
}
