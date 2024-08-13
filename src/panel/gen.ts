import { emptyDirSync, existsSync, mkdirSync, writeFileSync } from "fs-extra";
import { basename, dirname, join, resolve } from "path";
import { ConfigData, DirClientName, DirServerName, ItemData } from "./const";
import CCP from "cc-plugin/src/ccp/entry-render";
import jszip from "jszip";
export class Gen {
  private isMergeJson: boolean = false;
  private isFormatJson: boolean = false;
  private isFormatJsCode: boolean = false;
  private jsonFileName: string = "";
  private jsFileName: string = "";
  private tsFileName: string = "";
  private isExportServer: boolean = false;
  private isExportClient: boolean = false;
  private isExportJson: boolean = false;
  private exportJsonType: boolean = false;
  private isExportTs: boolean = false;
  private jsSavePath: string = "";
  private tsSavePath: string = "";
  private jsonSavePath: string = "";
  private isExportJs: boolean = false;
  private isMergeJavaScript: boolean = false;
  private isMergeTs: boolean = false;
  private isExportTwo: boolean = false;
  private _addLog(log: string) {
    throw new Error(log);
  }

  resolvePath(basePath: string, relativePath: string): string {
    return relativePath.startsWith('../') || relativePath.startsWith('./')
      ? resolve(basePath, relativePath)
      : relativePath;
  }

  public ready(cfg: ConfigData) {
    this.isMergeJson = cfg.json_merge;
    this.isMergeTs = cfg.ts_merge;
    this.isMergeJavaScript = cfg.js_merge;

    this.jsonFileName = cfg.json_all_cfg_file_name;
    this.jsFileName = cfg.js_file_name;
    this.tsFileName = cfg.ts_file_name;

    this.isExportServer = cfg.exportServer;
    this.isExportClient = cfg.exportClient;

    this.isExportJson = cfg.exportJson;
    this.exportJsonType = cfg.exportJsonType;
    this.isExportJs = cfg.exportJs;
    this.isExportTs = cfg.exportTs;

    const basePath = __dirname;
    this.jsSavePath = this.resolvePath(basePath, cfg.js_save_path);
    this.jsonSavePath = this.resolvePath(basePath, cfg.json_save_path);
    this.tsSavePath = this.resolvePath(basePath, cfg.ts_save_path);

    this.isFormatJsCode = cfg.js_format;
    this.isFormatJson = cfg.json_format;
  }
  public check() {
    if (CCP.Adaptation.Env.isPlugin) {
      if (this.isExportJs) {
        if (!this.jsSavePath || !existsSync(this.jsSavePath)) {
          throw new Error(`无效的js保存路径: ${this.jsSavePath}`);
        }
      }
      if (this.isExportJson) {
        if (!this.jsonSavePath || !existsSync(this.jsonSavePath)) {
          throw new Error(`无效的json保存路径: ${this.jsonSavePath}`);
        }
      }
      if (this.isExportTs) {
        if (!this.tsSavePath || !existsSync(this.tsSavePath)) {
          throw new Error(`无效的ts保存路径: ${this.tsSavePath}`);
        }
      }
    }

    if (this.isMergeJson) {
      if (!this.jsonFileName || this.jsonFileName.length <= 0) {
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

    if (this.isExportJson === false && this.isExportJs === false && this.isExportTs === false) {
      throw new Error("请选择要导出的类型!");
    }
  }
  /**
   * 保存客户端的json数据
   */
  private jsonAllClientData = {};
  private jsonAllClientTypeData = {};
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
  private jsonAllServeTypeData = {};

  async doWork(data: ItemData[]): Promise<void> {
    // 删除老的配置
    [this.jsonSavePath, this.tsSavePath, this.jsSavePath].forEach((item) => {
      [DirClientName, DirServerName].forEach((dir) => {
        const fullPath = join(item, dir);
        if (existsSync(fullPath)) {
          emptyDirSync(fullPath);
        }
      });
    });

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
    this.exportTs(zip);
    if (CCP.Adaptation.Env.isWeb) {
      const content = await zip.generateAsync({ type: "blob" });
      const filename = "excel.zip";
      await CCP.Adaptation.Download.downloadBlobFile(filename, content);
    }
    return;
  }
  private exportTs(zip: null | jszip) {
    if (!this.isExportTs) {
      return;
    }
    if (this.isMergeTs) {
      if (this.isExportClient) {
        const fullPath = join(this.tsSavePath, DirClientName, `${this.tsFileName}.ts`);
        this.saveTsFile(this.jsonAllClientData, fullPath, zip);
      }
      if (this.isExportServer) {
        const fullPath = join(this.tsSavePath, DirServerName, `${this.tsFileName}.ts`);
        this.saveTsFile(this.jsonAllServerData, fullPath, zip);
      }
    } else {
      if (this.isExportClient) {
        for (const key in this.jsonAllClientData) {
          const fullPath = join(this.tsSavePath, DirClientName, `${key}.ts`);
          const data = this.jsonAllClientData[key];
          this.saveTsFile(data, fullPath, zip);
        }
      }
      if (this.isExportServer) {
        for (const key in this.jsonAllServerData) {
          const data = this.jsonAllServerData[key];
          const fullPath = join(this.tsSavePath, DirServerName, `${key}.ts`);
          this.saveTsFile(data, fullPath, zip);
        }
      }
    }
  }
  private saveTsFile(data: any, path: string, zip: null | jszip) {
    const str = "export default " + JSON.stringify(data, null, 2) + ";";
    // 如果不存在目录 需要创建目录
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path));
    }
    writeFileSync(path, str);
    console.log("[TypeScript]" + path);
    zip && zip.file(path, str);
    return str;
  }
  private exportJson(zip: null | jszip) {
    if (!this.isExportJson) {
      return;
    }

    this.isExportTwo = this.isExportClient && this.isExportServer;
    if (this.isMergeJson) {
      if (this.isExportClient) {
        const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirClientName : "", `${this.jsonFileName}.json`);
        this.saveJsonFile(this.jsonAllClientData, fullPath, zip);
      }
      if (this.isExportServer) {
        const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirServerName : "", `${this.jsonFileName}.json`);
        this.saveJsonFile(this.jsonAllServerData, fullPath, zip);
      }
    } else {
      if (this.isExportClient) {
        for (const key in this.jsonAllClientData) {
          const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirClientName : "", `${key}.json`);
          const data = this.jsonAllClientData[key];
          this.saveJsonFile(data, fullPath, zip);
        }

      }
      if (this.isExportServer) {
        for (const key in this.jsonAllServerData) {
          const data = this.jsonAllServerData[key];
          const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirServerName : "", `${key}.json`);
          this.saveJsonFile(data, fullPath, zip);
        }
      }
    }

    if (this.exportJsonType) {
      if (this.isExportClient) {
        const fullPath = join(this.tsSavePath, this.isExportTwo ? DirClientName : "");
        this.check2CreateConfigBase(fullPath);
        for (const key in this.jsonAllClientData) {
          const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirClientName : "", `${key}.json`);
          let typeData = this.jsonAllClientTypeData[key];
          this.saveJsonTypeFile(typeData, fullPath, zip, DirClientName);
        }

      }
      if (this.isExportServer) {
        const fullPath = join(this.tsSavePath, this.isExportTwo ? DirServerName : "");
        this.check2CreateConfigBase(fullPath);
        for (const key in this.jsonAllServerData) {
          const fullPath = join(this.jsonSavePath, this.isExportTwo ? DirServerName : "", `${key}.json`);
          let typeData = this.jsonAllServeTypeData[key];
          this.saveJsonTypeFile(typeData, fullPath, zip, DirServerName);
        }
      }
    }
  }

  private check2CreateConfigBase(path: string) {
    const configPath = join(path, 'ConfigBase.ts');
    if (existsSync(configPath)) return;
    const ClsStr = `export default abstract class ConfigBase {
  // 自动初始化数据
  init(data: any) {
      if (data && typeof data === 'object') {
          Object.keys(data).forEach(key => {
              if (this.hasOwnProperty(key)) {
                  (this as any)[key] = data[key];
              }
          });
      }
  }
}`;
    if (!existsSync(dirname(configPath))) {
      mkdirSync(dirname(configPath));
    }
    writeFileSync(configPath, ClsStr);
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

  private saveJsonTypeFile(data: any, path: string, zip: null | jszip, key: string) {
    const typeName = basename(path);
    const fullPath = join(this.tsSavePath, this.isExportTwo ? key : "", `${typeName.split(".")[0]}.ts`);
    // // 如果不存在目录 需要创建目录
    // if (!existsSync(dirname(fullPath))) {
    //   mkdirSync(dirname(fullPath));
    // }
    writeFileSync(fullPath, data);
    console.log("[TypeScript]:" + fullPath);
    zip && zip.file(fullPath, data);
  }

  private getTypeScriptType(rule: string): string {
    if (rule.search(/^(int|number)$/i) !== -1) {
      return 'number = 0';
    } else if (rule.search(/^(string)$/i) !== -1) {
      return 'string = ""';
    } else if (rule.search(/^(bool|boolean)$/i) !== -1) {
      return 'boolean = false';
    } else if (rule.search(/^(object)$/i) !== -1) {
      return 'object';
    } else if (rule.search(/^(any)$/i) !== -1) {
      return 'any';
    } else if (rule.search(/Array\[Object\{[a-zA-Z0-9\[\]:,"]*\}\]/) !== -1) {
      const keys = this.extractKeys(rule);
      const keyTypes = keys.map(key => `${key}: ${this.getTypeScriptType(this.extractType(rule, key))}`);
      return `Array<{${keyTypes.join('; ')}}>`;
    } else if (rule.search(/Array\[Array\[Number\]\]/) === 0 || rule.search(/Array\[Number\]/) === 0) {
      return 'number[][]';
    } else if (rule.search(/Array\[String\]/) === 0) {
      return 'string[]';
    } else if (rule.search(/Array\[Array\[String\]\]/) === 0) {
      return 'string[][]';
    } else if (rule.search(/Object\{[a-zA-Z0-9\[\]:,"]*\}/) === 0) {
      const keys = this.extractKeys(rule);
      const keyTypes = keys.map(key => `${key}: ${this.getTypeScriptType(this.extractType(rule, key))}`);
      return `{${keyTypes.join('; ')}}`;
    } else if (rule.search(/\[]int/) !== -1) {
      const dimensions = (rule.match(/\[/g) || []).length;
      if (dimensions == 0) return 'number = 0';
      return `number${new Array(dimensions).fill('[]').join('')}`;
    } else if (rule.search(/\[]string/) !== -1) {
      const dimensions = (rule.match(/\[/g) || []).length;
      if (dimensions == 0) return 'string = ""';
      return `string${new Array(dimensions).fill('[]').join('')}`;
    } else {
      return 'any';
    }
  }

  private extractKeys(rule: string): string[] {
    const keys: string[] = [];
    const regex = /"([a-zA-Z0-9]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rule)) !== null) {
      keys.push(match[1]);
    }
    return keys;
  }

  private extractType(rule: string, key: string): string {
    const regex = new RegExp(`"${key}":\\s*([a-zA-Z0-9\\[\\]{}:,"]*)`, 'g');
    const match = regex.exec(rule);
    return match ? match[1] : 'any';
  }

  private flushExcelData(itemSheet: ItemData, all: any, data: any, allType: any, types: string) {
    const { sheet, name } = itemSheet;
    if (Object.keys(data).length > 0) {
      if (all[sheet] === undefined) {
        all[sheet] = data;
        allType[sheet] = types;
      } else {
        throw new Error(`发现重名sheet: ${name}:${sheet}`);
      }
    }
  }
  private parseExcelData(itemSheet: ItemData) {
    const { client, server, typeC, typeS } = this.splitData(itemSheet);
    this.flushExcelData(itemSheet, this.jsonAllClientData, client, this.jsonAllClientTypeData, typeC);
    this.flushExcelData(itemSheet, this.jsonAllServerData, server, this.jsonAllServeTypeData, typeS);
  }

  private isServerField(str: string) {
    return str.indexOf("s") !== -1;
  }
  private isClientField(str: string) {
    return str.indexOf("c") !== -1;
  }
  private splitData(itemSheet: ItemData): { server: any; client: any, typeC: string, typeS: string } {
    const excelData: any[][] = itemSheet.buffer;
    const title = excelData[0];
    const desc = excelData[1];
    /**
     * 是客户端还是服务器
     */
    const target = excelData[2];
    const ruleText = excelData[3];
    const ret = { server: {}, client: {}, typeC: '', typeS: '' };
    const typeLinesC: string[] = [];
    const typeLinesS: string[] = [];
    for (let i = 0; i < title.length; i++) {
      const key = title[i];
      const comment = desc[i];
      const rule = ruleText[i];
      const tar = target[i];
      if (key && rule) {
        let type = this.getTypeScriptType(rule);
        let hasDefaultValue = type.indexOf('=') !== -1;
        if (tar.indexOf("c") != -1) {
          typeLinesC.push(`  /** ${comment} */\n  ${key}${hasDefaultValue ? "" : "?"}: ${type};`);
        }
        if (tar.indexOf("s") != -1) {
          typeLinesS.push(`  /** ${comment} */\n  ${key}${hasDefaultValue ? "" : "?"}: ${type};`);
        }
      }
    }
    ret.typeC = `import ConfigBase from "./ConfigBase";\n
export default class ${itemSheet.sheet.split(".")[0]} extends ConfigBase {
${typeLinesC.join('\n')}\n}`;
    ret.typeS = `import ConfigBase from "./ConfigBase";\n
export default class ${itemSheet.sheet.split(".")[0]} extends ConfigBase {
${typeLinesS.join('\n')}\n}`;

    for (let line = 4; line < excelData.length; line++) {
      const lineData = excelData[line];
      const id = lineData[0];
      if (!lineData.length) {
        // skip empty line
        continue;
      }
      if (lineData.length < title.length) {
        // throw new Error(`配置数据缺失:${itemSheet.name}:${itemSheet.sheet}:${line + 1}`);
      }

      const saveLineData = { server: {}, client: {} };
      for (let idx = 0; idx < title.length && idx < lineData.length; idx++) {
        const key = title[idx];
        if (!key || !ruleText[idx]) continue;
        const rule = ruleText[idx].trim();
        if (key === "Empty" || rule === "Empty") {
          continue;
        }

        let value = lineData[idx] || "";
        if (value) {
          value = this.cutString(rule, value);
        } else {
          continue;
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
    // 如果不存在目录 需要创建目录
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path));
    }
    writeFileSync(path, str);
    console.log("[Json]:" + path);
    zip && zip.file(path, str);
    return str;
  }
  saveJavaScriptFile(path: string, data: any, zip: null | jszip) {
    const str = "module.exports =" + JSON.stringify(data, null, this.isFormatJsCode ? 2 : 0) + ";";
    // 如果不存在目录 需要创建目录
    if (!existsSync(dirname(path))) {
      mkdirSync(dirname(path));
    }
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
    }
    else if (rule.search(/Object\{[a-zA-Z0-9\[\]:,"]*\}/) === 0) {
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
    else if (rule.search("Number") === 0 || rule.search("int") === 0) {
      result = Number(text);
    }
    // String
    else if (rule.search("String") === 0 || rule.search("string") === 0) {
      result = text;
    }
    // 数字 数组 等
    else if (rule.search("\\[]int") != -1) {
      // 可能为1,1 {1,1,1,20} 0|110|0 {{101,5},{102,5}} {{{101,50,0}},{{102,50,500}}} 等
      const dimensions = (rule.match(/\[/g) || []).length; // 计算维度
      text = text.toString();
      if (dimensions === 1) {
        result = text.split(/[|,{}]/).filter(Boolean).map(Number);
      } else if (dimensions === 2) {
        result = text.split(/[{}]/).filter(value => value && value != ",").map(item => item.split(",").map(Number));
      } else if (dimensions === 3) {
        result = text.split(/}},\s*{{/).map(item => {
          return item.split(/},\s*{/).map(subItem => {
            return subItem.replace(/[{}]/g, '').split(',').map(Number);
          });
        });
      }
    }
    // 字符串 数组 等
    else if (rule.search("\\[]string") != -1) {
      const dimensions = (rule.match(/\[/g) || []).length; // 计算维度
      text = text.toString();
      if (dimensions === 1) {
        result = text.split(/[{}]/).filter(Boolean).map(item => item.split(/[,|]/));
      } else if (dimensions === 2) {
        result = text.split(/[{}]/).filter(value => value && value != ",").map(item => item.split(","));
      } else if (dimensions === 3) {
        result = text.split(/}},\s*{{/).map(item => {
          return item.split(/},\s*{/).map(subItem => {
            return subItem.replace(/[{}]/g, '').split(',');
          });
        });
      }
    }


    return result;
  }
}
