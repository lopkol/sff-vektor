function removeJunkFromString(str: string) {
  return str.replace(/[\u200B-\u200D\uFEFF]/g, "");
}
const middleDot = " \u00B7 ";

function findTagWithTextContent(
  document: Document,
  tag: string,
  text: string,
): Element | null {
  const elements = document.getElementsByTagName(tag);
  for (const element of elements) {
    if (element.textContent?.includes(text)) {
      return element;
    }
  }
  return null;
}

export function getAuthorsFromBookPage(
  document: Document,
): { name: string; relativeUrl: string }[] {
  const authorDiv: Element = document.getElementsByClassName("authors")[0];
  const authorsNames = removeJunkFromString(authorDiv.textContent || "").split(
    middleDot,
  );
  const authorLinksCollection: HTMLCollectionOf<HTMLAnchorElement> = authorDiv
    .getElementsByTagName("a");

  const authors = authorsNames.map((name, index) => ({
    name,
    relativeUrl: authorLinksCollection[index].href,
  }));
  return authors;
}

export function getTitleAndSeriesFromBookPage(
  document: Document,
): { title: string; series: string | null; seriesNum: string | null } {
  const titleNode =
    document.getElementsByTagName("h1")[0].getElementsByTagName("span")[0];
  let title = removeJunkFromString(titleNode.textContent || "");

  const isInSeries = titleNode.getElementsByTagName("a").length > 0;
  let series: string | null = null, seriesNum: string | null = null;
  if (isInSeries) {
    const seriesText = titleNode
      .getElementsByTagName("a")[0]
      .textContent
      ?.slice(1, -2);
    const words = seriesText?.split(" ");
    seriesNum = words?.pop() || null;
    series = words?.join(" ") || null;
    title = title.slice(0, title.length - 5 - (seriesText?.length || 0));
  } else {
    title = title.slice(0, title.length - 1);
  }
  return { title, series, seriesNum };
}

export function getOriginalVersionUrlFromBookPage(
  document: Document,
): string | null {
  const originalDiv = findTagWithTextContent(
    document,
    "h3",
    "Eredeti mű",
  )?.parentElement || null;

  if (!originalDiv) {
    return null;
  }
  const originalLink = Array.from(originalDiv.getElementsByTagName("a")).find(
    (linkNode) => linkNode.className.includes("book_selector"),
  );
  if (!originalLink) {
    return null;
  }
  return originalLink.href;
}
