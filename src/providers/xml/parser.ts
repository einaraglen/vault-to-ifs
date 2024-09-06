import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import { ExportPart } from "../../utils/tools";

type FileProperties = { VaultFilePath: string; LinkedFolders: string };

type Properties = {
  Property: { "#text"?: string | number; "@_name": string }[];
};

type Structures = { [key: string]: SubComponent | SubComponent[] };

type SubComponent = { [key: string]: Component } & { Properties: Properties };

type Component = {
  Properties: Properties;
  Structures?: Structures;
  FileProperties?: FileProperties;
};

export class Parser {
  private reader: XMLParser;
  private filePath: string;
  private rows: ExportPart[] = [];
  private connections: Record<string, string>;

  constructor(filePath: string) {
    this.connections = JSON.parse(fs.readFileSync(process.env.XML_TRANSFORM_PATH, "utf-8"));
    this.filePath = filePath;
    this.reader = new XMLParser({ ignoreAttributes: false });
  }

  public parse() {
    const xml = fs.readFileSync(this.filePath, "utf-8");
    const obj = this.reader.parse(xml);

    this.traverse(obj.Export.AssemblyComponent, null, null);

    return this.rows;
  }

  public getUser() {
    const root = this.rows[0];
    let name = root.author.toLowerCase();

    const replacement = { æ: "ae", ø: "o", å: "aa" };

    for (const [no, en] of Object.entries(replacement)) {
      name = name.split(no).join(en);
    }

    const user = name.split(" ").join(".");
    return `${user}@seaonics.com`;
  }

  private traverse(obj: Component, parent: Component | null, props: Properties | null) {
    let data = this.assignProps(obj, parent, props);

    // All drawing should be in standard UoM
    if (!data.partNumber.startsWith("16")) {
      data.units = "PCS";
    }

    this.rows.push(data);

    if (obj.Structures == null) {
      return;
    }

    for (const group of Object.values(obj.Structures)) {
      if (Array.isArray(group)) {
        for (const child of group) {
          const key = Object.keys(child)[1];
          this.traverse(child[key], obj, child.Properties);
        }
      } else {
        const key = Object.keys(group)[1];
        this.traverse(group[key], obj, group.Properties);
      }
    }
  }

  private transform(part: any, parent: any | null): ExportPart {
    const obj: any = {};

    for (const [key, value] of Object.entries(this.connections)) {
      let data = null;

      if (value.startsWith("_") && parent) {
        data = (parent as any)[value.replace("_", "")];
      } else {
        data = (part as any)[value];
      }

      obj[key] = data != null ? String(data) : "";
    }

    return obj;
  }

  private assignObject(props: Properties) {
    return props.Property.reduce((acc: any, item) => {
      const key = item["@_name"];
      const value = item["#text"] !== undefined ? item["#text"] : null;
      acc[key] = value;
      return acc;
    }, {});
  }

  private assignProps(obj: Component, parent: Component | null, props: Properties | null) {
    const part = this.assignObject(obj.Properties);

    if (parent == null || props == null) {
      return this.transform(part, null);
    }

    const _parent = this.assignObject(parent.Properties);
    const meta = this.assignObject(props);
    return this.transform({ ...part, ...meta }, _parent);
  }
}