import { defineStore } from "pinia";
import { ConfigData } from "./const";
import { ref } from "vue";
export const appStore = defineStore("app", () => {
  const config = ref<ConfigData>(new ConfigData());
  return {
    config,
    save() {},
  };
});
