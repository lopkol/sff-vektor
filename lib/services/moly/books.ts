// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
import axios from "axios";
import rax from "retry-axios";
import { molyBaseUrl, raxConfig } from "./constants.ts";

rax.attach();

function removeJunkFromString(str: string) {
  return str.replace(/[\u200B-\u200D\uFEFF]/g, "");
}
const middleDot = " \u00B7 ";

function getAuthors(document: Document) {
  const authorDiv: Element = document.getElementsByClassName("authors")[0];
  const authorsNames = removeJunkFromString(authorDiv.textContent || "").split(
    middleDot,
  );
  const authorLinksCollection = authorDiv.getElementsByTagName("a");

  const authors = authorsNames.map((name, index) => ({
    name,
    molyUrl: molyBaseUrl + authorLinksCollection[index].href,
  }));
  return authors;
}

function getTitleAndSeries(document: Document) {
  const titleNode =
    document.getElementsByTagName("h1")[0].getElementsByTagName("span")[0];
  const isInSeries = titleNode.getElementsByTagName("a").length;
  let title = removeJunkFromString(titleNode.textContent || "");
  let series = "";
  let seriesNum = "";
  if (isInSeries) {
    const seriesText = titleNode.getElementsByTagName("a")[0].textContent
      ?.slice(
        1,
        -2,
      );
    let words = seriesText?.split(" ");
    seriesNum = words?.pop() || "";
    series = words?.join(" ") || "";
    title = title.slice(0, title.length - 5 - (seriesText?.length || 0));
  } else {
    title = title.slice(0, title.length - 1);
  }
  return { title, series, seriesNum };
}

function getOriginal(document: Document) {
  const originalDiv = document.querySelector(".databox.clearfix");
  if (!originalDiv) {
    return null;
  }
  const originalLink = originalDiv.querySelector(".book_selector");
  if (!originalLink) {
    return null;
  }
  const url = molyBaseUrl + originalLink.href;
  return {
    name: "eredeti",
    urls: [url],
  };
}

async function getBookDetails(url: string) {
  try {
    const res = await axios.get(url, { raxConfig });
    const { document } = new JSDOM(res.data).window;

    const authors = getAuthors(document);
    const { title, series, seriesNum } = getTitleAndSeries(document);

    const originalVersion = getOriginal(document);
    const hunVersion = {
      name: "magyar",
      urls: [url],
    };
    const alternatives = originalVersion
      ? [hunVersion, originalVersion]
      : [hunVersion];

    const book = { authors, title, series, seriesNum, alternatives };

    return book;
  } catch (error) {
    throw new Error(`failed to get book details from ${url}`);
  }
}
