const keyList = [
  "close",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  "enter",
  "shift",
  "symbol",
  "space",
  "backspace",
  "clear",
  "refresh",
];

export const symbolKeyList = [
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "-",
  "_",
  "=",
  "+",
  "\\",
  "|",
  "{",
  "}",
  "[",
  "]",
  ";",
  ":",
  "'",
  '"',
  ",",
  ".",
  "<",
  ">",
  "$",
  "~",
  "`",
  "!",
  "@",
  "#",
  "/",
  "?",
];

function getKeyDict() {
  const keyDict: { [key: string]: string } = {};
  let keyValue = 2;
  keyList.forEach((key) => {
    keyDict[key] = `${keyValue}`;
    keyValue++;
  });
  let symbolKeyValue = 3;

  symbolKeyList.forEach((key) => {
    keyDict[key] = `${symbolKeyValue}`;
    symbolKeyValue++;
  });
  return keyDict;
}

export const keyDict = getKeyDict();
