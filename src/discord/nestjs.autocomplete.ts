import { Injectable } from "@nestjs/common";
import {
  ApplicationCommandOptionChoice,
  AutocompleteInteraction,
} from "discord.js";
import Fuse from "fuse.js";
import { TransformOptions } from "necord";

const {
  promises: { readdir },
} = require("fs");

const fs = require("fs");
const path = require("path");

function flatten(lists) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath) {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => fs.statSync(path).isDirectory());
}

function getFiles(srcpath) {
  return fs
    .readdirSync(srcpath)
    .map((file) => path.join(srcpath, file))
    .filter((path) => !fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath) {
  return [
    srcpath,
    ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive)),
  ];
}

interface SearchFile {
  url: string;
  title: string;
  content: string;
}

const contentPath = path.join(__dirname, "content");
const files = getDirectoriesRecursive(contentPath).flatMap((v) => getFiles(v));

export const NestjsDocumentationSections = files.flatMap((f) =>
  parseContent(
    f
      .replace(contentPath, "")
      .replaceAll("\\", "/")
      .replace("/", "")
      .replace(".md", ""),
    fs.readFileSync(f, "utf8")
  )
);

function parseContent(path: string, content: string): SearchFile[] {
  const baseUrl = `https://docs.nestjs.com/${path}`;
  // At least 2 # to be a header, otherwise it would catch the bash comments
  const headers = (content.match(/^(##+.*)/gm) || []).map((v) => v.trim());
  const results: SearchFile[] = [];
  let titles: string[] = [];
  if (path.includes("/")) {
    titles.push(path.split("/")[0]);
  }
  for (const header of headers) {
    // Header start with `### x`, using the space indicates the depth of the title.
    const currentDepth = Math.max(header.indexOf(" "), 0);
    let currentTitle = header.substring(currentDepth + 1);
    titles.length = currentDepth;
    titles[currentDepth] = currentTitle;
    const title = titles.filter((v) => v).join(" > ");
    let url = baseUrl;
    if (titles.filter((v) => v).length > 1) {
      url += `#${currentTitle.toLocaleLowerCase().replace(/ /g, "-")}`;
    }

    const sectionContentIndexStart = content.indexOf(header) + header.length;
    let sectionContent = content.substring(sectionContentIndexStart);
    if (headers[headers.length - 1] !== header) {
      const nextHeader = headers[headers.indexOf(header) + 1];
      const nextSectionStart = sectionContent.indexOf(nextHeader);
      sectionContent = sectionContent.substring(0, nextSectionStart);
    }

    results.push({
      url,
      title,
      content: sectionContent.trim(),
    });
  }

  return results;
}

@Injectable()
export class NestjsDocumentationAutocomplete implements TransformOptions {
  private fuse: Fuse<SearchFile>;

  public constructor() {
    this.init();
  }

  private async init() {
    this.fuse = new Fuse(NestjsDocumentationSections, {
      //   threshold: 0.3,
      keys: ["title", "content"],
    });
  }

  public transformOptions(
    interaction: AutocompleteInteraction,
    focused: ApplicationCommandOptionChoice
  ) {
    // Automatically autocomplete all fields with the name `item` with the GE items.
    // Todo: Use a constant for this field name
    if (focused.name !== "doc") {
      return;
    }
    const choices = this.fuse
      .search(focused.value.toString())
      .slice(0, 25)
      .map((choice) => ({
        name: choice.item.title,
        value: choice.item.title,
      }));
    return choices;
  }
}
