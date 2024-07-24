import inquirer from "inquirer";
import * as fs from "node:fs";
import * as path from "path";
import { compareVersions } from "compare-versions";

import type { FilePayload, PayloadFile } from "./types";
import _payload from "./payload.json";

const currVersion = "0.3.0";

const payloadFile = _payload as PayloadFile;

const cwd = process.cwd();
const cwdArr = cwd.split("\\");

const pkgPath = path.resolve(cwd, "package.json");
const pkgExists = fs.existsSync(pkgPath);
const pkgJSON = () => {
  if (pkgExists) {
    return JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as object;
  } else {
    throw new Error("package.json does not exist");
  }
};

const checkUpdateable = (): string => {
  if (!pkgExists) {
    return "No package.json found. Select another option.";
  }
  if (pkgnfVersion()) {
    const versionComp = compareVersions(pkgnfVersion(), currVersion);
    if (versionComp == 1) {
      return "This npm package is out of date. Update and try again.";
    }
    if (versionComp == 0) {
      return "This project is up to date.";
    }
    if (versionComp == -1) {
      return "";
    }
  } else {
    return "Current project does not appear to be built upon nfpwbase. Select 'Use current folder' to continue";
  }
};

const pkgnfVersion = () => {
  if (pkgExists) {
    return pkgJSON()["nfpw-version"] as string;
  } else {
    return "";
  }
};

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

const init = () => {
  type Answers = {
    cmd: string;
    projname?: string;
  };
  const questions = [
    {
      type: "list",
      name: "cmd",
      message: "What do you want to do?",
      choices: [
        { name: "Create a new project folder", value: "new" },
        { name: "Use current folder", value: "current" },
        {
          name: "Update nfpwbase version",
          value: "update",
          disabled: checkUpdateable(),
        },
      ],
    },
    // new project questions
    {
      type: "input",
      name: "projname",
      message: "What is the name of your project? (lowercase and - only)",
      validate(answer: string) {
        if (/^[a-z]+(-[a-z]+)*$/g.test(answer)) {
          return true;
        }
        throw new Error("Lowercase letters and '-' only");
      },
      when(answers: Answers) {
        return answers.cmd == "new";
      },
    },
  ];

  inquirer
    .prompt(questions)
    .then((answers: Answers) => {
      switch (answers.cmd) {
        case "new":
          createNew(answers.projname);
          console.log();
          console.log("Your project folder has been created.");
          break;
        case "current":
          if (isEmpty(cwd)) {
            generateProjectDir(cwd);
            console.log();
            console.log("Your project folder has been populated.");
          } else {
            upgradeProjectDir(cwd);
            console.log();
            console.log("Your project folder has been upgraded.");
          }
          break;
        case "update":
          break;
        default:
          break;
      }

      console.log("\nNow run:");
      if (answers.cmd == "new") {
        console.log(`  cd ${answers.projname}`);
      }
      console.log("  git init");
      console.log("  npm install");
      console.log("  code .");
      console.log();
      console.log(
        "Make sure to look at the nfpwbase-README.md and install the VSCode Extensions listed, restarting VSCode after installing."
      );
      console.log();

      console.log(
        "If you have run this tool from inside VSCode, you will need to close it and reopen."
      );
      console.log();
    })
    .catch((err) => {
      console.log(err);
    });
};

const createNew = (project: string) => {
  const projPath = path.resolve(cwd, project);
  fs.mkdirSync(projPath, { recursive: true });
  generateProjectDir(projPath);
};

const generateProjectDir = (projPath: string) => {
  const vPayload: FilePayload[] = payloadFile.payloads[currVersion];
  createAllFolders(projPath);

  for (const file of vPayload) {
    const filePath = path.resolve(projPath, file.path, file.filename);

    if (file.type == "json") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const filePayload: object = JSON.parse(file.payload);

      if (file.filename == "package.json") {
        filePayload["name"] = process.cwd().split("\\")[cwdArr.length - 1];
      }
      fs.writeFileSync(filePath, JSON.stringify(filePayload));
    } else {
      fs.writeFileSync(filePath, file.payload);
    }
  }
};

const upgradeProjectDir = (projPath: string) => {
  const manualUpdates = [];
  createAllFolders(projPath);
  const vPayload: FilePayload[] = payloadFile.payloads[currVersion];
  for (const file of vPayload) {
    const filePath = path.resolve(projPath, file.path, file.filename);
    if (file.type == "json") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const filePayload: object = JSON.parse(file.payload);

      if (file.filename == "package.json") {
        filePayload["name"] = process.cwd().split("\\")[cwdArr.length - 1];
      }
      fs.writeFileSync(filePath, JSON.stringify(filePayload));
    } else {
      if (fs.existsSync(filePath)) {
        manualUpdates.push(`${file.path}${file.filename}`);
      } else {
        fs.writeFileSync(filePath, file.payload);
      }
    }
  }

  if (manualUpdates.length > 0) {
    console.log("The following file(s) cannot be updated automatically.");
    for (const update of manualUpdates) {
      console.log(`  ${update}`);
    }
    console.log("");
    console.log("Compare files against GitHub files and update as needed.");
  }
};

// const updateFile = (file: object, filePath: string) => {};

const createAllFolders = (projPath: string) => {
  for (const folderPath of payloadFile.folders) {
    fs.mkdirSync(path.resolve(projPath, folderPath), {
      recursive: true,
    });
  }
};

init();
