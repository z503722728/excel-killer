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
   * 导出JavaScript
   */
  exportJs: boolean;
  /**
   * 导出Lua
   */
  exportLua: boolean;
}
