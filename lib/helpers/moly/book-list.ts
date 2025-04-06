export function getOtherPages(document: Document): string[] {
  const paginationDiv = document.querySelector(".pagination");
  const otherPages: string[] = [];
  if (paginationDiv) {
    const pageLinkNodes: HTMLCollectionOf<HTMLAnchorElement> = paginationDiv
      .getElementsByTagName("a");
    if (!pageLinkNodes.length || pageLinkNodes.length <= 1) {
      return otherPages;
    }
    // skip last one (that is the "next page" link)
    for (let i = 0; i <= pageLinkNodes.length - 2; i++) {
      otherPages.push(pageLinkNodes[i].href);
    }
  }
  return otherPages;
}

export type BookFromList = {
  relativeUrl: string;
  id: string | null;
};

export function getBooksFromListPage(
  document: Document,
): BookFromList[] {
  const bookDivs = document.querySelectorAll(".book_atom");

  return Array.from(bookDivs).map((bookDiv: Element) => {
    const bookLinkNode = bookDiv.getElementsByTagName("a")[0];
    return {
      relativeUrl: bookLinkNode.href,
      id: bookLinkNode.getAttribute("data-id"),
    };
  });
}

export type BookFromShelf = {
  relativeUrl: string;
  id: string | null;
  note: string | null;
};

export function getBooksFromShelfPage(
  document: Document,
): BookFromShelf[] {
  const bookDivs = document.querySelectorAll(".tale_item");
  const booksFromShelf: BookFromShelf[] = [];

  bookDivs.forEach((bookDiv: Element) => {
    const bookLinkNode = bookDiv.querySelector(".book_atom")
      ?.getElementsByTagName("a")[0];
    if (!bookLinkNode) {
      return;
    }
    const noteNode = bookDiv.querySelector(".sticky_note");
    booksFromShelf.push({
      relativeUrl: bookLinkNode.href,
      id: bookLinkNode.getAttribute("data-id"),
      note: noteNode ? noteNode.textContent : null,
    });
  });

  return booksFromShelf;
}
