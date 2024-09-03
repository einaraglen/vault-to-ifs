import { Html, Body, Heading, Tailwind, Section, Column, Row, Preview, Hr, Text } from "@react-email/components";
import { CodeBlock, vscDarkPlus as theme } from "@react-email/code-block";
import * as React from "react";
import { CommitError, IFSError, MSSQLError } from "../src/utils/error";

const test_json = {
  rowID: "577E113F-FC23-4062-8112-8BCE83880724",
  ItemNumber: "Drain port",
  Revision: "A",
  Quantity: "1",
  Pos: "27.4",
  ParentItemNumber: "16701384",
  ParentItemRevision: "A",
  ChildCount: "0",
  Category: "Engineering",
  Title: "",
  Description: "",
  Units: "Each",
  LifecycleState: "Released",
  Category_1: "",
  Category_2: "",
  Category_3: "",
  Category_4: "",
  InternalDescription: "",
  Mass_g: "",
  Material: "Generic",
  MaterialCertifikate: "",
  Project: "",
  SerialNo: "",
  SparePart: "",
  Vendor: "",
  CriticalItem: "False",
  LongLeadItem: "",
  SupplierPartNo: "",
  ReleaseDate: "2023-01-09 01:57:00Z",
  LastUpdate: "2023-05-11T11:52:51.137Z",
  Status: "AcceptedBOM",
  ErrorDescription: null,
  ReleasedBy: "Jobserver",
  LastUpdatedBy: "Jobserver",
  "State(Historical)": "Released",
  TransactionId: "369e2024-9459-4b3d-904b-cb83c468b8d3",
  InventorQuantity: "1",
  NewRevision: null,
  NewParentItemRevision: "A",
};

const test_transaction = "369e2024-9459-4b3d-904b-cb83c468b8d3";
const test_ifs_error = new IFSError("The part number must be entered in upper-case.", "Create Catalog Part", test_json);
const test_mssql_error = new MSSQLError("Could not find root component", "Get Root Component");
const test_commit_error = new CommitError("Failed to Commit", "Parts");
const test_error = new Error("Something is very wrong here!");

interface ErrorMailProps {
  error: IFSError | MSSQLError | CommitError | Error;
  transaction: string;
}

export const ErrorEmail = ({ error = test_ifs_error, transaction = test_transaction }: ErrorMailProps) => {
  return (
    <Html>
      <Preview>Transaction: {transaction}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Section className="max-w-[700px]">
            <Heading as="h2">Import Failed</Heading>
            <Hr />
            <Section className="mb-5 mt-3">
              <Row>
                <Column className="w-[150px]">Error</Column>
                <Column>{error.name}</Column>
              </Row>
              {(error as any).func != null && (
                <Row>
                  <Column className="w-[150px]">Function</Column>
                  <Column>{(error as any).func}</Column>
                </Row>
              )}
              <Row>
                <Column className="w-[150px]">Message</Column>
                <Column>{error.message}</Column>
              </Row>
              <Row>
                <Column className="w-[150px]">Transaction</Column>
                <Column>{transaction}</Column>
              </Row>
            </Section>
            <Hr />

            {(error as any).row != null && (
              <Text>
                Following <strong>Line</strong> Failed
              </Text>
            )}
            {(error as any).row != null && (
              <Section>
                <CodeBlock code={JSON.stringify((error as IFSError).row, null, 4)} theme={theme} language="javascript" />
              </Section>
            )}
            <Section>
              <CodeBlock code={error.stack as any} theme={theme} language="log" />
            </Section>
            <Text>If this mail does not seem necessary for you, contact the mail administrator to be removed from the list.</Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ErrorEmail;
