import { defineStore } from "pinia";
import { ConfigData } from "./const";
import { ref } from "vue";
import profile from "cc-plugin/src/ccp/profile";
import pluginConfig from "../../cc-plugin.config";
import { toRaw } from "vue";
export const appStore = defineStore("app", () => {
  const config = ref<ConfigData>(new ConfigData());
  return {
    config,
    init() {
      profile.init(new ConfigData(), pluginConfig);
      const data = profile.load(`${pluginConfig.manifest.name}.json`) as ConfigData;
      config.value.excel_root_path = data.excel_root_path;
      config.value.exportClient = data.exportClient;
      config.value.exportServer = data.exportServer;
      config.value.exportJson = data.exportJson;
      config.value.json_merge = data.json_merge;
      config.value.json_all_cfg_file_name = data.json_all_cfg_file_name;
      config.value.json_format = data.json_format;
      config.value.json_save_path = data.json_save_path;
      config.value.json_import_project_cfg_path = data.json_import_project_cfg_path;
      config.value.exportJs = data.exportJs;
      config.value.js_save_path = data.js_save_path;
      config.value.js_merge = data.js_merge;
      config.value.js_file_name = data.js_file_name;
      config.value.js_format = data.js_format;
      config.value.expand_excel = data.expand_excel;
      config.value.expand_json = data.expand_json;
      config.value.expand_js = data.expand_js;
      config.value.expand_lua = data.expand_lua;
      config.value.expand_export = data.expand_export;
    },
    save() {
      const cfg = toRaw(config.value);
      profile.save(cfg);
    },
  };
});
