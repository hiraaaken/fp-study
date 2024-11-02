import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as ord from "fp-ts/Ord";
import * as N from "fp-ts/number";
import type { TvShow } from "./types";

/**
 * Tv番組の情報をa放映期間でソートするための条件
 * - 放映期間が短い順にソート
 */
const byPeriod = pipe(
	N.Ord,
	ord.contramap((tvShow: TvShow) => tvShow.end - tvShow.start),
);

/**
 * Tv番組の情報をソートします。
 * - 放映期間を基準に降順でソートします。
 *
 * @param shows - Tv番組の情報
 * @returns ソートされたTv番組の情報
 */
const sortShows = (shows: Array<TvShow>): Array<TvShow> => {
	return pipe(shows, A.sortBy([byPeriod]), A.reverse);
};

/**
 * Tv番組のダミー情報
 */
const shows: Array<TvShow> = [
	{ title: "The Office", start: 2005, end: 2013 },
	{ title: "Breaking Bad", start: 2008, end: 2013 },
	{ title: "Friends", start: 1994, end: 2004 },
	{ title: "The Simpsons", start: 1989, end: 2021 },
];

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

/** Optionを使用しなかった場合（例外を送出する） */
// const parseShow = (rawShow: string): TvShow => {
// 	const bracketOpen = rawShow.indexOf("(");
// 	const bracketClose = rawShow.indexOf(")");
// 	const dash = rawShow.indexOf("-");

// 	const title = rawShow.slice(0, bracketOpen - 1).trim();
// 	const start = Number(rawShow.slice(bracketOpen + 1, dash));
// 	const end = Number(rawShow.slice(dash + 1, bracketClose));

// 	return { title, start, end };
// };

/** 以下、Option型を使用して関数を設計した場合 */

/**
 * 与えられた文字列からタイトルを抽出します。
 *
 * @param rawShow - タイトルを含む文字列
 * @returns タイトルが存在する場合は `Option<string>`、存在しない場合は `Option<none>`
 */
const extractTitle = (rawShow: string): O.Option<string> => {
	const bracketOpen = rawShow.indexOf("(");

	/**
	 * Optionモナドを使用した場合
	 * - `O.Do`でOptionモナドを開始
	 * - `O.bind`で値を取り出し、次の処理に渡す
	 * - `O.map`で最終的な値を返す
	 */
	return pipe(
		O.Do,
		O.bind("title", () => {
			if (bracketOpen > 0) {
				return O.some(rawShow.slice(0, bracketOpen - 1).trim());
			}
			return O.none;
		}),
		O.map(({ title }) => title),
	);
};

/**
 * 与えられた文字列から開始年を抽出します。
 *
 * @param rawShow - 開始年を含む文字列
 * @returns 開始年が存在する場合は `Option<number>`、存在しない場合は `Option<none>`
 */
const extractYearStart = (rawShow: string): O.Option<number> => {
	const bracketOpen = rawShow.indexOf("(");
	const dash = rawShow.indexOf("-");

	/**
	 * Optionモナドを使用した場合
	 * - `O.Do`でOptionモナドを開始
	 * - `O.bind`で値を取り出し、次の処理に渡す
	 * - `O.map`で最終的な値を返す
	 */
	return pipe(
		O.Do,
		/**
		 * 年の文字列を取得
		 * - `bracketOpen`が存在し、`dash`が存在する場合
		 *   - `bracketOpen`から`dash`までの文字列を取得
		 * - それ以外の場合は`none`を返す
		 */
		O.bind("yearStr", () => {
			if (bracketOpen !== -1 && dash !== -1) {
				return O.some(rawShow.slice(bracketOpen + 1, dash));
			}
			return O.none;
		}),
		/**
		 * 年の文字列を数値に変換
		 * - `yearStr`が存在する場合
		 *  - 数値に変換した年をsomeにラップして返す
		 */
		O.bind("year", ({ yearStr }) => O.some(Number(yearStr))),
		O.map(({ year }) => year),
	);
};

/**
 * 与えられｒた文字列から終了年を抽出します。
 *
 * @param rawShow - 終了年を含む文字列
 * @returns 終了年が存在する場合は `Option<number>`、存在しない場合は `Option<none>`
 */
const extractYearEnd = (rawShow: string): O.Option<number> => {
	const bracketClose = rawShow.indexOf(")");
	const dash = rawShow.indexOf("-");

	/**
	 * Optionモナドを使用した場合
	 * - `O.Do`でOptionモナドを開始
	 * - `O.bind`で値を取り出し、次の処理に渡す
	 * - `O.map`で最終的な値を返す
	 */
	return pipe(
		O.Do,
		/**
		 * 年の文字列を取得
		 * - `dash`が存在し、`bracketClose`が存在する場合
		 *  - `dash`から`bracketClose`までの文字列を取得し、someにラップして返す
		 * - それ以外の場合は`none`を返す
		 */
		O.bind("yearStr", () => {
			if (dash !== -1 && bracketClose !== -1) {
				return O.some(rawShow.slice(dash + 1, bracketClose));
			}
			return O.none;
		}),
		/**
		 * 年の文字列を数値に変換
		 * - `yearStr`が存在する場合
		 *  - 数値に変換した年をsomeにラップして返す
		 */
		O.bind("year", ({ yearStr }) => O.some(Number(yearStr))),
		O.map(({ year }) => year),
	);
};

/**
 * 与えられた文字列から単一の年を抽出します。
 *
 * @param rawShow - 年を含む文字列
 * @returns 年が存在する場合は `Option<number>`、存在しない場合は `Option<none>`
 */
const extractSingleYear = (rawShow: string): O.Option<number> => {
	const dash = rawShow.indexOf("-");
	const bracketOpen = rawShow.indexOf("(");
	const bracketClose = rawShow.indexOf(")");

	/**
	 * Optionモナドを使用した場合
	 * - `O.Do`でOptionモナドを開始
	 * - `O.bind`で値を取り出し、次の処理に渡す
	 * - `O.map`で最終的な値を返す
	 */
	return pipe(
		O.Do,
		/**
		 * 年の文字列を取得
		 * - `dash`が存在せず、`bracketOpen`が存在し、`bracketClose`が`bracketOpen`よりも後ろにある場合
		 *   - `bracketOpen`から`bracketClose`までの文字列を取得
		 * - それ以外の場合は`none`を返す
		 */
		O.bind("yearStr", () => {
			if (dash === -1 && bracketOpen !== -1 && bracketClose > bracketOpen + 1) {
				return O.some(rawShow.slice(bracketOpen + 1, bracketClose));
			}
			return O.none;
		}),
		/**
		 * 年の文字列を数値に変換
		 * - `yearStr`が存在する場合
		 *  - 数値に変換した年をsomeにラップして返す
		 */
		O.bind("year", ({ yearStr }) => O.some(Number(yearStr))),
		O.map(({ year }) => year),
	);
};

/**
 * TvShowの情報を含む文字列を解析します。
 *
 * @param rawShow - TvShowの情報を含む文字列
 * @returns TvShowの情報が存在する場合は `Option<TvShow>`、存在しない場合は `Option<none>`
 */
const parseShow = (rawShow: string): O.Option<TvShow> => {
	/**
	 * Optionモナドを使用した場合
	 * - `O.Do`でOptionモナドを開始
	 * - `O.bind`で値を取り出し、次の処理に渡す
	 *   - `O.orElse`で値が存在しない場合の処理を行う
	 * - `O.map`で最終的な値を返す
	 */
	return pipe(
		O.Do,
		O.bind("title", () => extractTitle(rawShow)),
		/**
		 * 開始年を取得
		 * - `extractYearStart`で開始年を取得
		 *   - 開始年の解析に失敗した場合は`extractSingleYear`で単一の年を取得
		 */
		O.bind("start", () =>
			pipe(
				extractYearStart(rawShow),
				O.orElse(() => extractSingleYear(rawShow)),
			),
		),
		/**
		 * 終了年を取得
		 * - `extractYearEnd`で終了年を取得
		 *   - 終了年の解析に失敗した場合は`extractSingleYear`で単一の年を取得
		 */
		O.bind("end", () =>
			pipe(
				extractYearEnd(rawShow),
				O.orElse(() => extractSingleYear(rawShow)),
			),
		),

		O.map(({ title, start, end }) => ({ title, start, end })),
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
	parsedShows: O.Option<Array<TvShow>>,
	newParsedShow: O.Option<TvShow>,
): O.Option<Array<TvShow>> => {
	return pipe(
		O.Do,
		O.bind("shows", () => parsedShows),
		O.bind("parsedShow", () => newParsedShow),
		O.map(({ shows, parsedShow }) => shows.concat(parsedShow)),
	);
};

/**
 * Tv番組の情報を含む文字列の配列を解析します。
 *
 * @param rawShows - Tv番組の情報を含む文字列の配列
 * @returns Tv番組の情報を配列にして返す
 */
// const parseShows = (rawShows: Array<string>): Array<TvShow> => {
// 	return pipe(
// 		rawShows,
// 		A.map(parseShow),
// 		/**
// 		 * Optionモナドを使用した場合
// 		 * - `A.filterMap`で`Option<TvShow>`の値を取り出し、`TvShow`の値を返す
// 		 *  - `Option<TvShow>`が`none`の場合は除外される
// 		 */
// 		A.filterMap((show) => show),
// 	);
// };

/** オールオアナッシング型のエラーハンドリングを追加した場合 */
const parseShows = (rawShows: Array<string>): O.Option<Array<TvShow>> => {
	const initial: O.Option<Array<TvShow>> = O.some([]);
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

/**
 * Tv番組の情報をコンソールに表示します。
 */
// for (const show of parseShows(rawShows)) {
// 	console.log(show); // noneは除外されて表示される
// }

/** オールオアナッシング型のエラーハンドリングを追加した場合 */
pipe(
	parseShows(rawShows),
	O.fold(
		() => console.log("none"),
		(shows) => {
			for (const show of shows) {
				console.log(show);
			}
		},
	),
);

/**
 * 以下、さまざまなエラー要件に対応して、合成した関数
 * - orElseを使用することで、複数の関数を合成することができる
 */

const extractSingleYearOrYearEnd = (rawShow: string): O.Option<number> => {
	return pipe(
		O.Do,
		() => extractSingleYear(rawShow),
		O.orElse(() => extractYearEnd(rawShow)),
	);
};

const extractAnyYear = (rawShow: string): O.Option<number> => {
	return pipe(
		O.Do,
		() => extractYearStart(rawShow),
		O.orElse(() => extractYearEnd(rawShow)),
		O.orElse(() => extractSingleYear(rawShow)),
	);
};

const extractSingleYearIfNameExists = (rawShow: string): O.Option<number> => {
	return pipe(
		O.Do,
		O.bind("title", () => extractTitle(rawShow)),
		O.flatMap((title) => extractSingleYear(rawShow)),
	);
};

const extractAnyYearIfNameExists = (rawShow: string): O.Option<number> => {
	return pipe(
		O.Do,
		O.bind("title", () => extractTitle(rawShow)),
		O.flatMap((title) => extractAnyYear(rawShow)),
	);
};
