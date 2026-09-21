import { test } from "node:test";
import assert from "node:assert/strict";
import { csvToJson, jsonToCsv, parseCsv } from "./data";

void test("CSV preserves quoted commas, line breaks, doubled quotes and trailing empties", () => {
  assert.deepEqual(parseCsv('a,b,c\r\n"hello, world","line 1\nline 2",\r\n'), [
    ["a", "b", "c"],
    ["hello, world", "line 1\nline 2", ""],
  ]);
  assert.deepEqual(parseCsv('"a""b",c'), [['a"b', "c"]]);
});
void test("CSV validation rejects truncated or ambiguous data", () => {
  assert.throws(() => parseCsv('"unclosed'), /unclosed/);
  assert.throws(() => csvToJson("a,a\n1,2"), /unique/);
  assert.throws(() => csvToJson("a,b\n1,2,3"), /same number/);
});
void test("JSON and CSV retain string content and encoding-sensitive values", () => {
  const json = '[{"name":"Zoë","id":"001","note":"a,b\\nline \\\"two\\\""}]';
  assert.deepEqual(JSON.parse(csvToJson(jsonToCsv(json))), JSON.parse(json));
  assert.match(csvToJson("__proto__,number\nx,001"), /"number": "001"/);
});
void test("JSON export requires tabular data and handles nested values explicitly", () => {
  assert.throws(() => jsonToCsv('{"name":"one"}'), /array of objects/);
  assert.match(jsonToCsv('[{"value":{"a":1}},{"other":false}]'), /value,other/);
});
