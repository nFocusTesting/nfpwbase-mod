import * as fs from "node:fs";
import * as path from "path";
import { glob } from "glob";

import type { PayloadFile, FilePayload } from "../src/types";

const cwd = process.cwd();

const payloadFile = path.resolve(cwd, "src/payload.json");
const prevPayloadFile = fs.existsSync(payloadFile)
  ? fs.readFileSync(payloadFile).toString()
  : "{}";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const nfpwbasePackage = JSON.parse(
  fs.readFileSync(path.resolve(cwd, "nfpwbase/package.json")).toString()
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const prevPayload: PayloadFile = JSON.parse(prevPayloadFile);

const newPayload: PayloadFile = {
  folders: [],
  versions: [],
  payloads: {},
  ...prevPayload,
};

const _filelist = await glob("nfpwbase/**/*", {
  dot: true,
});
const _folderlist = await glob("nfpwbase/**/", { dot: true });

const filelist = _filelist
  .map((item) => {
    if (_folderlist.includes(item)) {
      return null;
    }
    if (item == "nfpwbase\\.git") {
      return null;
    }
    if (item == "nfpwbase\\package-lock.json") {
      return null;
    }
    return item.replace(/\\/g, "/");
  })
  .filter((el) => {
    return el != null;
  });
const folderlist = _folderlist
  .map((item) => {
    return "./" + item.substring(9);
  })
  .slice(1);

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
const newVersion: string = nfpwbasePackage["nfpw-version"];
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
newPayload.versions.push(newVersion);
newPayload.folders = folderlist;

// console.log(filelist);

const newVerPayload: FilePayload[] = [];

for await (const _file of filelist) {
  const newFilePayload: FilePayload = {
    filename: "",
    link: "",
    path: "",
    type: "",
    update: "",
    payload: "",
  };

  const fileArr = _file.split("/");
  let filename = fileArr[fileArr.length - 1];
  if (filename == "README.md") {
    filename = "nfpwbase-README.md";
  }
  const filenameArr = filename.split(".");
  const ext = filenameArr[filenameArr.length - 1];

  const fileContents = fs.readFileSync(path.resolve(cwd, _file), "utf-8");

  newFilePayload.filename = filename;

  newFilePayload.link =
    "https://github.com/nFocusTesting/nfpwbase/blob/main/" +
    fileArr.slice(1).join("/");

  const filepath = "./" + fileArr.slice(1, fileArr.length - 1).join("/") + "/";
  filepath.replace("//", "/");
  newFilePayload.path = filepath;

  newFilePayload.type = ext == "json" ? "json" : "file";

  newFilePayload.update = ext == "json" ? "patch" : "manual";

  newFilePayload.payload = fileContents;

  newVerPayload.push(newFilePayload);
}

newPayload.payloads[newVersion] = newVerPayload;

fs.writeFileSync(
  path.resolve(cwd, "testPayload.json"),
  JSON.stringify(newPayload)
);
