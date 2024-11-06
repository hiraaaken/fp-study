import type { Book, Movie } from "./types";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";

/**
 * ダミーデータ
 */
const books: Array<Book> = [
	{
		title: "The Great Gatsby",
		authors: ["F. Scott Fitzgerald"],
	},
	{
		title: "The Catcher in the Rye",
		authors: ["J.D. Salinger"],
	},
	{
		title: "To Kill a Mockingbird",
		authors: ["Harper Lee"],
	},
	{
		title: "The Hobbit",
		authors: ["Tolkien"],
	},
	{
		title: "FP in TypeScript",
		authors: ["Quramy", "Fahad"],
	},
];

/**
 * TypeScriptという言葉が含まれている本が何冊あるかをカウントする
 *
 * @param books 本のリスト
 */
const countBooks = (books: Array<Book>): number => {
	return books
		.map((book) => book.title)
		.filter((title) => title.includes("TypeScript")).length;
};

console.log(countBooks(books)); // => 1

const bookAdaptations = (author: string): Array<Movie> => {
	if (author === "Tolkien") {
		return [
			{ title: "An Unexpected Journey" },
			{ title: "The Desolation of Smaug" },
		];
	}
	return [];
};

const recomendationFeed = (books: Array<Book>): void => {
	const result = books.flatMap((book) =>
		book.authors.flatMap((author) =>
			bookAdaptations(author).map(
				(movie) =>
					`You may like ${movie.title}, because your liked ${author}'s ${book.title}`,
			),
		),
	);
	console.log(result);
};

recomendationFeed(books);

// nesteed flatMap example
type Point = {
	x: number;
	y: number;
};

console.log(
	[1, 5, 3, 9].flatMap((x) => [-2, 7, 10, 0, 2].flatMap((y) => ({ x, y }))),
);

// ネストされたflatMapを解消するには、for内包表記を使う
// Typescriptには、for内包表記がないので、fp-tsのArrayモナドを使う
const recomendationFeedWithMonad = (books: Array<Book>): void => {
	const result = pipe(
		A.Do,
		A.bind("book", () => books),
		A.bind("author", ({ book }) => book.authors),
		A.bind("movie", ({ author }) => bookAdaptations(author)),
		A.map(
			({ book, author, movie }) =>
				`You may like ${movie.title}, because your liked ${author}'s ${book.title}`,
		),
	);
	console.log(result);
};

recomendationFeedWithMonad(books);
