import CCP from "cc-plugin/src/ccp/entry-render";
import sql from "sql.js";

export class SQL {
  private SQL: any = null;
  constructor() {
    this.SQL = null;
  }
  async init() {
    if (this.SQL) {
      return this.SQL;
    }
    this.SQL = await sql({
      locateFile: (file: string) => {
        if (CCP.Adaptation.Env.isWeb) {
          return `./static/${file}`;
        } else {
          const url = CCP.Adaptation.AssetDB.getStaticFile(file);
          return url;
        }
      },
    });
  }
  private getTableRowsCount(db: any, name: string) {
    const sel = db.prepare(`SELECT COUNT(*) AS count FROM '${name}'`);
    if (sel.step()) {
      const count = sel.getAsObject()["count"];
      sel.free();
      return count;
    } else {
      sel.free();
      return -1;
    }
  }
  private parseTable(db: any, name: string, rowCount: number): Array<Record<string, string | number>> {
    const ret: Array<Record<string, string | number>> = [];
    const defaultSelect = `SELECT * FROM '${name}'`;
    let sel = null;
    try {
      sel = db.prepare(defaultSelect);
    } catch (e) {
      sel && sel.free();
      return ret;
    }
    const columnNames = sel.getColumnNames();
    let count = 0;
    let map = {};
    while (sel.step()) {
      count++;
      const values: Array<string | number> = sel.get();
      const item: Record<string, string | number> = {};
      if (columnNames.length < values.length) {
        debugger;
      }
      for (let i = 0; i < values.length; i++) {
        item[columnNames[i]] = values[i];
      }
      // console.log(item);
      const mapKey = JSON.stringify(item);
      if (map[mapKey]) {
        debugger;
      } else {
        map[mapKey] = true;
        ret.push(item);
      }
    }
    if (count !== rowCount) {
      debugger;
    }
    sel && sel.free();
    return ret;
  }
  parseDatabase(buffer: ArrayBuffer): Record<string, Array<Record<string, string | number>>> {
    const ret: Record<string, Array<Record<string, string | number>>> = {};
    const db = new this.SQL.Database(new Uint8Array(buffer));
    const tables = db.prepare("SELECT * FROM sqlite_master WHERE type='table' OR type='view' ORDER BY name");
    while (tables.step()) {
      const rowObj = tables.getAsObject();
      const name = rowObj["name"];
      const count = this.getTableRowsCount(db, name);
      const type = rowObj["type"];
      // console.log(name, type, count);
      const item: Array<Record<string, string | number>> = this.parseTable(db, name, count);
      ret[name] = item;
    }
    tables.free();
    db.close();
    return ret;
  }
}

export const sqlInstance = new SQL();
