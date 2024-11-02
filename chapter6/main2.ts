import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import type { TvShow } from "./types";

/**
 * Tv番組の情報を含む文字列のダミーデータ
 * - これを解析(パース)してTv番組の情報を取得します。
 */
const rawShows: Array<string> = [
	"The Office (2005-2013)",
	"Breaking Bad (2008-2013)",
	"Friends (1994-2004)",
	"The Simpsons, 1989-2021",
	"Game of Thrones (2011)",
];

/**
 * 与えられた文字列からタイトルを抽出します。
 *
 * @param rawShow - Tv番組の情報を含む文字列
 * @returns タイトルが存在する場合は `Either.right<string>`、存在しない場合は `Either.left<string>`
 */
const extractTitle = (rawShow: string): E.Either<string, string> => {
	const bracketOpen = rawShow.indexOf("(");

	return pipe(
		E.Do,
		E.bind("title", () => {
			if (bracketOpen > 0) {
				return E.right(rawShow.slice(0, bracketOpen - 1).trim());
			}
			return E.left(`Cannot extract title from: ${rawShow}`);
		}),
		E.map(({ title }) => title),
	);
};

const extractYearStart = (rawShow: string): E.Either<string, number> => {
	const bracketOpen = rawShow.indexOf("(");
	const dash = rawShow.indexOf("-");

	return pipe(
		E.Do,
		E.bind("yearStr", () => {
			if (bracketOpen !== -1 && dash > bracketOpen + 1) {
				return E.right(rawShow.slice(bracketOpen + 1, dash));
			}
			return E.left(`Cannot extract year start from: ${rawShow}`);
		}),
		E.bind("year", ({ yearStr }) => E.right(Number(yearStr))),
		E.map(({ year }) => year),
	);
};

/**
 * 与えられた文字列から終了年を抽出します。
 *
 * @param rawShow - Tv番組の情報を含む文字列
 * @returns 終了年が存在する場合は `Either.right<number>`、存在しない場合は `Either.left<string>`
 */
const extractYearEnd = (rawShow: string): E.Either<string, number> => {
	const dash = rawShow.indexOf("-");
	const bracketClose = rawShow.indexOf(")");

	return pipe(
		E.Do,
		E.bind("yearStr", () => {
			if (dash !== -1 && bracketClose > dash + 1) {
				return E.right(rawShow.slice(dash + 1, bracketClose));
			}
			return E.left(`Cannot extract year end from: ${rawShow}`);
		}),
		E.bind("year", ({ yearStr }) => E.right(Number(yearStr))),
		E.map(({ year }) => year),
	);
};

/**
 * 与えられた文字列から単一の年を抽出します。
 *
 * @param rawShow - Tv番組の情報を含む文字列
 * @returns 単一の年が存在する場合は `Either.right<number>`、存在しない場合は `Either.left<string>`
 */
const extractSingleYear = (rawShow: string): E.Either<string, number> => {
	const dash = rawShow.indexOf("-");
	const bracketOpen = rawShow.indexOf("(");
	const bracketClose = rawShow.indexOf(")");

	return pipe(
		E.Do,
		E.bind("yearStr", () => {
			if (dash === -1 && bracketOpen !== -1 && bracketClose > bracketOpen + 1) {
				return E.right(rawShow.slice(bracketOpen + 1, bracketClose));
			}
			return E.left(`Cannot extract single year from: ${rawShow}`);
		}),
		E.bind("year", ({ yearStr }) => E.right(Number(yearStr))),
		E.map(({ year }) => year),
	);
};

/**
 * 与えられた文字列からTV番組情報を抽出します。
 *
 * @param rawShow - TV番組情報を含む文字列
 * @returns TV番組情報が存在する場合は `Either.right<TvShow>`、存在しない場合は `Either.left<string>`
 */
const parseShow = (rawShow: string): E.Either<string, TvShow> => {
	return pipe(
		E.Do,
		E.bind("title", () => extractTitle(rawShow)),
		E.bind("start", () =>
			pipe(
				extractYearStart(rawShow),
				E.orElse(() => extractSingleYear(rawShow)),
			),
		),
		E.bind("end", () =>
			pipe(
				extractYearEnd(rawShow),
				E.orElse(() => extractSingleYear(rawShow)),
			),
		),
	);
};

/**
 * allOrNothing型のエラー処理を行う場合
 *
 * @param parsedShows - パースされたTv番組の情報
 * @param newParsedShow - 新たにパースされたTv番組の情報
 * @returns パースされたTv番組の情報をOption型の配列で返す
 */
const addOrResign = (
	parsedShows: E.Either<string, Array<TvShow>>,
	newParsedShow: E.Either<string, TvShow>,
): E.Either<string, Array<TvShow>> => {
	return pipe(
		E.Do,
		E.bind("shows", () => parsedShows),
		E.bind("parsedShow", () => newParsedShow),
		E.map(({ shows, parsedShow }) => shows.concat(parsedShow)),
	);
};

/**
 * 与えられた文字列の配列からTV番組情報を解析します。
 *
 * @param rawShows - TV番組情報を含む文字列の配列
 * @returns TV番組情報が存在する場合は `Either.right<Array<TvShow>>`、存在しない場合は `Either.left<string>`
 */
const parseShows = (
	rawShows: Array<string>,
): E.Either<string, Array<TvShow>> => {
	const initial: E.Either<string, Array<TvShow>> = E.right([]);

	return pipe(
		rawShows,
		A.map(parseShow),
		/**
		 * Optionモナドを使用した場合
		 * - `A.filterMap`で`Option<TvShow>`の値を取り出し、`TvShow`の値を返す
		 *  - `Option<TvShow>`が`none`の場合は除外される
		 */
		// A.filterMap((show) => show),
		A.reduce(initial, (acc, show) => addOrResign(acc, show)),
	);
};

pipe(
	parseShows(rawShows),
	E.fold(
		(error) => console.error(error),
		(shows) => console.log(shows),
	),
);
