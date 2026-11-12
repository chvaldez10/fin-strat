import { parseDateOnly } from "../../../lib/date-only";
import { parseMoneyCents } from "../amounts";
import type { StatementRow } from "./activity";

function readCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closedQuote = false;
  const finishCell = () => {
    row.push(cell.trim());
    cell = "";
    closedQuote = false;
  };
  const finishRow = () => {
    finishCell();
    if (row.some(Boolean)) rows.push(row);
    row = [];
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = false;
        closedQuote = true;
      }
    } else if (char === ",") finishCell();
    else if (char === "\n") finishRow();
    else if (char === "\r") {
      finishRow();
      if (text[index + 1] === "\n") index++;
    } else if (char === '"' && !cell.trim() && !closedQuote) {
      cell = "";
      quoted = true;
    } else if (closedQuote ? char.trim() : char === '"') {
      throw new Error("The CSV contains an invalid quoted field.");
    } else if (!closedQuote) cell += char;
  }
  if (quoted) throw new Error("The CSV contains an unfinished quoted field.");
  finishRow();
  return rows;
}

export function parseActivityCsv(
  text: string,
  month: string,
  outflowSign: "negative" | "positive"
) {
  const [header = [], ...records] = readCsv(text.replace(/^\uFEFF/, ""));
  const keys = header.map((value) => value.toLowerCase());
  const dateIndex = keys.findIndex((key) =>
    ["date", "transaction date", "posted date"].includes(key)
  );
  const descriptionIndex = keys.findIndex((key) =>
    ["description", "memo"].includes(key)
  );
  const amountIndex = keys.indexOf("amount");
  if (Math.min(dateIndex, descriptionIndex, amountIndex) < 0)
    throw new Error("Use a CSV with Date, Description and Amount columns.");
  let outsideMonth = 0;
  const rows: (Omit<StatementRow, "accountId"> & { description: string })[] =
    [];
  for (const [index, record] of records.entries()) {
    const date = record[dateIndex],
      description = record[descriptionIndex];
    if (record.length !== header.length || !parseDateOnly(date))
      throw new Error(
        `Record ${index + 1} needs the same columns as the header and a YYYY-MM-DD date.`
      );
    if (!date.startsWith(`${month}-`)) {
      outsideMonth++;
      continue;
    }
    const signed = record[amountIndex]
      .replace(/^\(([^()]+)\)$/, "-$1")
      .replace(/^([+-]?)\$/, "$1")
      .replace(/^\+/, "");
    const normalized = /^-?\d{1,3}(,\d{3})+(\.\d{0,2})?$/.test(signed)
      ? signed.replaceAll(",", "")
      : signed;
    const cents = parseMoneyCents(normalized, { allowNegative: true });
    if (
      !cents ||
      Math.abs(cents) > 1_000_000_000_000 ||
      !description ||
      description.length > 160
    )
      throw new Error(
        `Record ${index + 1} needs a description and a valid nonzero amount.`
      );
    rows.push({
      date,
      description,
      amountCents: Math.abs(cents),
      direction: cents < 0 === (outflowSign === "negative") ? "out" : "in",
    });
  }
  if (!rows.length)
    throw new Error("This file has no transactions in the selected month.");
  if (rows.length > 500)
    throw new Error(
      "Split this month's CSV into files of up to 500 transactions."
    );
  return { rows, outsideMonth };
}
