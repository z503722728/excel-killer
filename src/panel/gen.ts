import { emptyDirSync, existsSync, writeFileSync } from "fs-extra";
import { join } from "path";
import { dirClientName, dirServerName } from "./const";
// @ts-ignore
import nodeXlsx from "nodeXlsx";
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
  public excelArray: any[] = [];
  private _addLog(log: string) {
    throw new Error(log);
  }
  onBtnClickGen() {
    // 参数校验
    if (this.excelArray.length <= 0) {
      this._addLog("未发现要生成的配置!");
      return;
    }

    if (this.isMergeJson) {
      if (!this.jsonAllCfgFileName || this.jsonAllCfgFileName.length <= 0) {
        this._addLog("请输入要保存的json文件名!");
        return;
      }
    }
    if (this.isMergeJavaScript) {
      if (!this.jsFileName || this.jsFileName.length <= 0) {
        this._addLog("请输入要保存的js文件名!");
        return;
      }
    }
    // TODO
    if (this.isExportServer === false && this.isExportClient === false) {
      this._addLog("请选择要导出的目标!");
      return;
    }

    if (this.isExportJson === false && this.isExportJs === false) {
      this._addLog("请选择要导出的类型!");
      return;
    }

    // 删除老的配置
    const jsonSavePath1 = join(this.jsonSavePath, dirClientName);
    const jsonSavePath2 = join(this.jsonSavePath, dirServerName);
    emptyDirSync(jsonSavePath1);
    emptyDirSync(jsonSavePath2);

    const jsSavePath1 = join(this.jsSavePath, dirClientName);
    const jsSavePath2 = join(this.jsSavePath, dirServerName);
    emptyDirSync(jsSavePath1);
    emptyDirSync(jsSavePath2);

    const jsonAllSaveDataClient = {}; // 保存客户端的json数据
    const jsonAllSaveDataServer = {}; // 保存服务端的json数据

    const jsAllSaveDataClient = {}; // 保存客户端的js数据
    const jsAllSaveDataServer = {}; // 保存服务端的js数据

    for (const k in this.excelArray) {
      const itemSheet = this.excelArray[k];
      if (itemSheet.isUse) {
        const excelData = nodeXlsx.parse(itemSheet.fullPath);
        let sheetData = null;
        for (const j in excelData) {
          if (excelData[j].name === itemSheet.sheet) {
            sheetData = excelData[j].data;
          }
        }
        if (sheetData) {
          if (sheetData.length > 3) {
            if (this.isExportJson) {
              // 保存为json
              const writeFileJson = function (pathSave, isClient) {
                const jsonSaveData = this._getJsonSaveData(sheetData, itemSheet, isClient);
                if (Object.keys(jsonSaveData).length > 0) {
                  if (this.isMergeJson) {
                    if (isClient) {
                      // 检测重复问题
                      if (jsonAllSaveDataClient[itemSheet.sheet] === undefined) {
                        jsonAllSaveDataClient[itemSheet.sheet] = jsonSaveData;
                      } else {
                        this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                      }
                    } else {
                      // 检测重复问题
                      if (jsonAllSaveDataServer[itemSheet.sheet] === undefined) {
                        jsonAllSaveDataServer[itemSheet.sheet] = jsonSaveData;
                      } else {
                        this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                      }
                    }
                  } else {
                    const saveFileFullPath = join(pathSave, itemSheet.sheet + ".json");
                    this._onSaveJsonCfgFile(jsonSaveData, saveFileFullPath);
                  }
                }
              }.bind(this);
              if (this.isExportClient) writeFileJson(jsonSavePath1, true);
              if (this.isExportServer) writeFileJson(jsonSavePath2, false);
            }
            if (this.isExportJs) {
              // 保存为js
              const writeFileJs = function (savePath, isClient) {
                const sheetJsData = this._getJavaScriptSaveData(sheetData, itemSheet, isClient);
                if (Object.keys(sheetJsData).length > 0) {
                  if (this.isMergeJavaScript) {
                    if (isClient) {
                      // 检测重复问题
                      if (jsAllSaveDataClient[itemSheet.sheet] === undefined) {
                        jsAllSaveDataClient[itemSheet.sheet] = sheetJsData;
                      } else {
                        this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                      }
                    } else {
                      // 检测重复问题
                      if (jsAllSaveDataServer[itemSheet.sheet] === undefined) {
                        jsAllSaveDataServer[itemSheet.sheet] = sheetJsData;
                      } else {
                        this._addLog("发现重名sheet:" + itemSheet.name + "(" + itemSheet.sheet + ")");
                      }
                    }
                  } else {
                    // 保存js配置
                    const fileNameFullPath = join(savePath, itemSheet.sheet + ".js");
                    this._onSaveJavaScriptCfgFile(fileNameFullPath, sheetJsData);
                  }
                }
              }.bind(this);
              if (this.isExportClient) writeFileJs(jsSavePath1, true);
              if (this.isExportServer) writeFileJs(jsSavePath2, false);
            }
          } else {
            this._addLog("行数低于3行,无效sheet:" + itemSheet.sheet);
          }
        } else {
          this._addLog("未发现数据");
        }
      } else {
        console.log("忽略配置: " + itemSheet.fullPath + " - " + itemSheet.sheet);
      }
    }
    // =====================>>>>  合并json文件   <<<=================================
    if (this.isExportJson && this.isMergeJson) {
      if (this.isExportClient) {
        const saveFileFullPath = join(jsonSavePath1, this.jsonAllCfgFileName + ".json");
        this._onSaveJsonCfgFile(jsonAllSaveDataClient, saveFileFullPath);
      }
      if (this.isExportServer) {
        const saveFileFullPath = join(jsonSavePath2, this.jsonAllCfgFileName + ".json");
        this._onSaveJsonCfgFile(jsonAllSaveDataServer, saveFileFullPath);
      }
      this.checkJsonAllCfgFileExist();
    }
    // =====================>>>>  合并js文件   <<<=================================
    if (this.isExportJs && this.isMergeJavaScript) {
      if (this.isExportClient) {
        this._onSaveJavaScriptCfgFile(join(jsSavePath1, this.jsFileName + ".js"), jsAllSaveDataClient);
      }
      if (this.isExportServer) {
        this._onSaveJavaScriptCfgFile(join(jsSavePath2, this.jsFileName + ".js"), jsAllSaveDataServer);
      }

      this.checkJsFileExist();
    }

    this._addLog("全部转换完成!");
  }
  _getJsonSaveData(excelData, itemSheet, isClient) {
    const title = excelData[0];
    const desc = excelData[1];
    const target = excelData[2];
    const ruleText = excelData[3];
    let ret = null;

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
      for (let i = 4; i < excelData.length; i++) {
        const lineData = excelData[i];
        if (lineData.length !== title.length) {
          this._addLog(`配置表头和配置数据不匹配:${itemSheet.name} - ${itemSheet.sheet} : 第${i + 1}行`);
          this._addLog("跳过该行数据");
          continue;
        }

        const saveLineData = {};
        let canExport = false;

        // todo 将ID字段也加入到data中
        for (let j = 0; j < title.length; j++) {
          canExport = false;
          if (isClient && target[j] && target[j].indexOf("c") !== -1) {
            canExport = true;
          } else if (!isClient && target[j] && target[j].indexOf("s") !== -1) {
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
        if (isClient && target[0] && target[0].indexOf("c") !== -1) {
          canExport = true;
        } else if (!isClient && target[0] && target[0].indexOf("s") !== -1) {
          canExport = true;
        }
        if (canExport) {
          saveData2[lineData[0].toString()] = saveLineData;
        }
      }
      ret = saveData2;
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
    const saveFileFullPath1 = join(this.jsonSavePath, dirClientName, this.jsonAllCfgFileName + ".json");
    const saveFileFullPath2 = join(this.jsonSavePath, dirServerName, this.jsonAllCfgFileName + ".json");
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
    const saveFileFullPath1 = join(this.jsSavePath, dirClientName, this.jsFileName + ".js");
    const saveFileFullPath2 = join(this.jsSavePath, dirServerName, this.jsFileName + ".js");
    if (existsSync(saveFileFullPath1) || existsSync(saveFileFullPath2)) {
      this.isJsFileExist = true;
    } else {
      this.isJsFileExist = false;
    }
  }
}
