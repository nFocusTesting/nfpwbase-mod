import inquirer from "inquirer";
import * as fs from "node:fs";
import * as path from "node:path";
import { compareVersions } from "compare-versions";
import payload from "./payload.json";

const currVersion = "1.2";
const cwd = process.cwd();
const cwdArr = cwd.split("\\");
const folderName = cwdArr[cwdArr.length - 1];
const pkgPath = path.resolve(cwd, "package.json");
const pkgExists = fs.existsSync(pkgPath);
const pkgJSON = () => {
  if (pkgExists) {
    return JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as object;
  } else {
    throw new Error("package.json does not exist");
  }
};
const pkgnfVersion = () => {
  if (pkgExists) {
    return pkgJSON()["nfBaseVersion"] as string;
  } else {
    return "";
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

const createNew = (project: string) => {
  fs.mkdirSync(path.resolve(cwd, project));
};

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
        break;
      case "current":
        break;
      case "update":
        break;
      default:
        break;
    }
  })
  .catch((err) => {
    console.log(err);
  });
