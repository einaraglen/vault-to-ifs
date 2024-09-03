class PL_Variable {
  protected name_: string;
  protected type_: string;
  protected value_?: any;

  constructor(name: string, type: string, value?: any) {
    this.name_ = name;
    this.type_ = type;
    this.value_ = value;
  }

  public get as_variable() {
    return `${this.name_} ${this.type_}${this.value_ ? " " + this.value_ + ";" : ";"}`;
  }

  public get as_param() {
    return `${this.name_} IN ${this.type_}`;
  }
}

class PL_Cursor {
  protected name_: string;
  protected params_: PL_Variable[];
  protected body_: string;

  constructor(name: string, params: PL_Variable[], body: string) {
    this.name_ = name;
    this.params_ = params;
    this.body_ = body;
  }

  public set name(name: string) {
    this.name_ = name;
  }

  public set param(params: PL_Variable | PL_Variable[]) {
    if (Array.isArray(params)) {
      this.params_.push(...params);
    } else {
      this.params_.push(params);
    }
  }

  public set body(body: string) {
    this.body_ = body;
  }

  private get_params() {
    return this.params_.map((param) => param.as_param).join(", ")
  }

  public get as_string() {
    let str = `CURSOR ${this.name_}(${this.get_params()}) IS\n`
    str += this.body_;
    return str
  }
}

class PL_Function {
  protected name_: string;
  protected type_: string
  protected params_: PL_Variable[];
  protected variables_: PL_Variable[];
  protected body_: string;

  constructor(name: string, type: string, params: PL_Variable[], variables: PL_Variable[], body: string) {
    this.name_ = name;
    this.type_ = type;
    this.params_ = params;
    this.variables_ = variables;
    this.body_ = body;
  }

  public set name(name: string) {
    this.name_ = name;
  }

  public set type(type: string) {
    this.type_ = type;
  }

  public set param(params: PL_Variable | PL_Variable[]) {
    if (Array.isArray(params)) {
      this.params_.push(...params);
    } else {
      this.params_.push(params);
    }
  }

  public set variable(variables: PL_Variable | PL_Variable[]) {
    if (Array.isArray(variables)) {
      this.variables_.push(...variables);
    } else {
      this.variables_.push(variables);
    }
  }

  public set body(body: string) {
    this.body_ = body;
  }

  private get_params() {
    return this.params_.map((param) => param.as_param).join(", ")
  }

  private get_variables() {
    this.variables_.map((variable) => variable.as_variable).join(";\n")
  }

  public get as_string() {
    let str = `FUNCTION ${this.name_}(${this.get_params()}) RETURN ${this.type_} IS\n`
    str += this.get_variables();
    str += "BEGIN"
    str += this.body_;
    str += `END ${this.name_};`
    return str
  }
}

export class PL_SQL {
  protected variables: PL_Variable[] = [];
  protected cursors: PL_Cursor[] = [];
  protected functions: PL_Function[] = [];
  protected data: string = "";

  constructor() {}

  public set variable(x: PL_Variable | PL_Variable[]) {
    if (Array.isArray(x)) {
      this.variables.push(...x);
    } else {
      this.variables.push(x);
    }
  }

  public set function(x: PL_Function | PL_Function[]) {
    if (Array.isArray(x)) {
      this.functions.push(...x);
    } else {
      this.functions.push(x);
    }
  }

  public set cursor(x: PL_Cursor | PL_Cursor[]) {
    if (Array.isArray(x)) {
      this.cursors.push(...x);
    } else {
      this.cursors.push(x);
    }
  }

  public set body(x: string) {
    this.data = x;
  }

  public static get builder() {
    return new PL_SQL();
  }

  public static Variable(name: string, type: string, value?: any) {
    return new PL_Variable(name, type, value);
  }

  public static Cursor(name: string) {
    return new PL_Cursor(name, [], "");
  }

  public static Function(name: string, type: string) {
    return new PL_Function(name, type, [], [], "");
  }

  public build() {
    let str = "";

    str += "DECLARE\n"

    

    str += "END;"

    return str;
  }
}

const query = PL_SQL.builder;

query.variable = PL_SQL.Variable("cnt_", "NUMBER", 0);
query.variable = PL_SQL.Variable("info_", "VARCHAR2(2000)");
query.variable = PL_SQL.Variable("attr_", "VARCHAR2(2000)");
query.variable = PL_SQL.Variable("objid_", "VARCHAR2(2000)");
query.variable = PL_SQL.Variable("objversion_", "VARCHAR2(2000)");

const cur = PL_SQL.Cursor("get_revision_object");
cur.param = PL_SQL.Variable("p_part_no_", "VARCHAR2");
cur.param = PL_SQL.Variable("p_part_rev_", "VARCHAR2");
cur.body = `
    SELECT objid, objversion
    FROM   &AO.ENG_PART_REVISION
    WHERE  part_no = p_part_no_
    AND    part_rev = p_part_rev_;
`;

const func = PL_SQL.Function("Prefix_Part_No__", "VARCHAR2");
func.param = PL_SQL.Variable("part_no_", "VARCHAR2");
func.variable = PL_SQL.Variable("prefixed_part_no_", "VARCHAR2(100)");
func.variable = PL_SQL.Variable("prefix_", "VARCHAR2(5)", "SE");
func.body = `
    IF ((part_no_ IS NULL) OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) OR ((LENGTH(part_no_) = 7) AND (SUBSTR(part_no_, 1, 1) != '2')) OR (LENGTH(part_no_) != 7)) THEN
        prefixed_part_no_ := part_no_;
    ELSE
        prefixed_part_no_ := prefix_ || part_no_;
    END IF;
    RETURN(prefixed_part_no_);
`;

query.cursor = cur;
query.function = func;

query.body = `
    cnt_  := &AO.ENG_PART_STRUCTURE_API.Number_Of_Parents_(:c01, :c02, 'STD');
    :temp := cnt_;

    IF cnt_ = 0 THEN
        OPEN get_revision_object(Prefix_Part_No__(:c01), :c02);
        FETCH get_revision_object
            INTO objid_, objversion_;
        CLOSE get_revision_object;

        &AO.ENG_PART_REVISION_API.Set_To_Obsolete__(info_, objid_, objversion_, attr_, 'DO');
        &AO.ENG_PART_REVISION_API.REMOVE__(info_, objid_, objversion_, 'DO');
    END IF;
`;
