import type { Book, Movie } from "./types";
import * as A from "fp-ts/Array";
import * as S from "fp-ts/Set";
import * as N from "fp-ts/number";
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

// 円の中に点はあるか？
const points: Array<Point> = [
	{ x: 5, y: 2 },
	{ x: 1, y: 1 },
];
const radiuses: Array<number> = [2, 1];

const isInside = (point: Point, radius: number): boolean => {
	return radius ** 2 >= point.x ** 2 + point.y ** 2;
};

// filter
console.log(
	pipe(
		A.Do,
		A.bind("r", () => radiuses.filter((r) => r > 0)),
		// fileterを使って、条件に合致するものだけを取り出す
		A.bind("point", ({ r }) => points.filter((p) => isInside(p, r))),
		A.map(
			({ r, point }) =>
				`Point(${point.x}, ${point.y}) is whithin a radius of ${r}`,
		),
	),
);

/**
 * Pointが円の中にあるかどうかを判定する
 * @param point 点
 * @param radius 半径
 */
const insideFilter = (point: Point, radius: number): Array<Point> => {
	return isInside(point, radius) ? [point] : [];
};

/**
 * 半径のバリデーション
 * @param radius 半径
 */
const validateRadius = (radius: number): Array<number> => {
	return radius > 0 ? [radius] : [];
};

console.log(
	pipe(
		A.Do,
		A.bind("r", () => radiuses),
		A.bind("validRadius", ({ r }) => validateRadius(r)),
		// filterを使って、条件に合致するものだけを取り出す
		A.bind("point", () => points),
		A.bind("inPoint", ({ point, validRadius }) =>
			insideFilter(point, validRadius),
		),
		A.map(
			({ validRadius, inPoint }) =>
				`Point(${inPoint.x}, ${inPoint.y}) is whithin a radius of ${validRadius}`,
		),
	),
);

console.log(
	pipe(
		A.Do,
		A.bind("a", () => [1, 2]),
		A.bind("b", () => [1, 2]),
		A.map(({ a, b }) => a * b),
	),
);

// Setを使って重複を排除する
console.log(
	new Set(
		pipe(
			A.Do,
			A.bind("a", () => [1, 2]),
			A.bind("b", () => [2, 1]),
			A.map(({ a, b }) => a * b),
		),
	),
);
