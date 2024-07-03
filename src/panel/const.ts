export interface ItemData {
  name: string;
  sheet: string;
  isUse: string;
}
export class ConfigData {
  /**
   * 导出服务端字段
   */
  exportServer: boolean;
  /**
   * 导出客户端字段
   */
  exportClient: boolean;
  /**
   * 导出JSON
   */
  exportJson: boolean;
  /**
   * 合并所有json
   */
  json_merge: boolean;
  /**
   * 合并的json文件名
   */
  json_all_cfg_file_name: string;
  /**
   * 格式化json
   */
  json_format: boolean;
  /**
   * json的保存路径
   */
  json_save_path: string;
  /**
   * creator项目的配置文件路径
   */
  json_import_project_cfg_path: string;
  /**
   * 导出JavaScript
   */
  exportJs: boolean;

  /**
   * js保存路径
   */
  js_save_path: string;
  /**
   * 合并js
   */
  js_merge: boolean;

  /**
   * 合并后的js文件名
   */
  js_file_name: string;

  /**
   * 格式化js
   */
  js_format: boolean;
  /**
   * 导出Lua
   */
  exportLua: boolean;
}
