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
  private transformFile = "assets\\transform\\xml.json";
  private reader: XMLParser;
  private filePath: string;
  private rows: ExportPart[] = [];
  private connections: Record<string, { property: string, defaultValue: any }>;

  constructor(filePath: string) {
    this.connections = JSON.parse(fs.readFileSync(this.transformFile, "utf-8"));
    this.filePath = filePath;
    this.reader = new XMLParser({ ignoreAttributes: false });
  }

  public parse() {
    const xml = fs.readFileSync(this.filePath, "utf-8");
    const obj = this.reader.parse(xml);

    if ("AssemblyComponent" in obj.Export) {
      this.traverse(obj.Export.AssemblyComponent, null, null);
    } else {
      this.read(obj.Export)
    }

    return this.collect();
  }

  private collect() {
    const unique: Record<string, ExportPart> = {}
    const children = [...this.rows]

    const rootIndex = children.findIndex((part) => part.parentPartNumber == "")
    const root = children[rootIndex]

    children.splice(rootIndex, 1)

    for (const part of this.rows) {
      unique[part.partNumber + "_" + part.revision] = part;
    }
    return { unique: Object.values(unique), children: children.length == 0 ? null : children, root }
  }

  private read(data: Record<string, Component>) {
    const keys = Object.keys(data)

    if (keys.length == 0 || keys.length > 1) {
      throw Error("Single part export contains more than (1) part")
    }

    const obj = data[keys[0]]

    const part = this.assignObject(obj.Properties);

    this.rows.push(this.transformPart(part));
  }

  private traverse(obj: Component, parent: Component | null, props: Properties | null) {
    let data = this.assignAssemblyProps(obj, parent, props);

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

  private transformPart(part: any) {
    const obj: any = {};

    for (const [key, value] of Object.entries(this.connections)) {
      const { property, defaultValue } = value

      let data = null;

      if (!property.startsWith("_")) {
        data = (part as any)[property] ?? defaultValue;
      }

      obj[key] = data != null ? String(data) : "";
    }

    obj.units = "PCS" // default for single parts

    return obj;
  }

  private transformAssembly(part: any, parent: any | null): ExportPart {
    const obj: any = {};

    for (const [key, value] of Object.entries(this.connections)) {
      const { property, defaultValue } = value
      let data = null;

      if (property.startsWith("_") && parent) {
        data = (parent as any)[property.replace("_", "")] ?? defaultValue;
      } else {
        data = (part as any)[property] ?? defaultValue;
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

  private assignAssemblyProps(obj: Component, parent: Component | null, props: Properties | null) {
    const part = this.assignObject(obj.Properties);

    if (parent == null || props == null) {
      return this.transformAssembly(part, null);
    }

    const _parent = this.assignObject(parent.Properties);
    const meta = this.assignObject(props);
    return this.transformAssembly({ ...part, ...meta }, _parent);
  }
}
