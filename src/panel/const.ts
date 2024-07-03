export interface ItemData {
  name: string;
  sheet: string;
  isUse: boolean;
}
export class ConfigData {
  /**
   * 导出服务端字段
   */
  exportServer: boolean = false;
  /**
   * 导出客户端字段
   */
  exportClient: boolean = false;
  /**
   * 导出JSON
   */
  exportJson: boolean = false;
  /**
   * 合并所有json
   */
  json_merge: boolean = false;
  /**
   * 合并的json文件名
   */
  json_all_cfg_file_name: string = "GameJsonCfg";
  /**
   * 格式化json
   */
  json_format: boolean = false;
  /**
   * json的保存路径
   */
  json_save_path: string = "";
  /**
   * creator项目的配置文件路径
   */
  json_import_project_cfg_path: string = "";
  /**
   * 导出JavaScript
   */
  exportJs: boolean = false;

  /**
   * js保存路径
   */
  js_save_path: string = "";
  /**
   * 合并js
   */
  js_merge: boolean = false;

  /**
   * 合并后的js文件名
   */
  js_file_name: string = "GameJsCfg";

  /**
   * 格式化js
   */
  js_format: boolean = false;
  /**
   * 导出Lua
   */
  exportLua: boolean = false;

  /**
   * excel根目录
   */
  excel_root_path: string = "";
}

export const dirClientName = "client";
export const dirServerName = "server";
