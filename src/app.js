/* eslint-disable no-param-reassign */

// バージョン
const VERSION = '1.2.1';

// 休暇テーブル
let HOLIDAY = {};

// global functions
const req = (method, url) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onload = () => {
        try {
            if (xhr.status >= 200 && xhr.status < 300) {
                const json = JSON.parse(xhr.responseText);

                // 祝日テーブルをセット
                HOLIDAY = json['HOLIDAY']; // eslint-disable-line prefer-destructuring, dot-notation

                // ブックマークレットのバージョンチェック
                if (json.VERSION !== VERSION) {
                    if (window.confirm('ブックマークレットに更新があります。最新版に更新してください。')) { // eslint-disable-line no-alert
                        window.location.href = json.URL;
                    }
                }

                // rakumo実行
                new RakumoTimeRecorder();
            } else {
                alert('休暇データの読込みに失敗しました。'); // eslint-disable-line no-alert
            }
        } catch (e) {
            console.error(e); // eslint-disable-line no-console
        }
    };
    xhr.send();
}

/**
 * RakumoTimeRecorderクラス
 *
 * @class RakumoTimeRecorder
 */
class RakumoTimeRecorder {
    constructor() {
        // インスタンス生成
        this.CalcTimeCard = new CalcTimeCard(); // eslint-disable-line no-undef
        this.TableParser = new TableParser('.tableBody .dateRow');

        // 初期値
        this.calcData = []; // 実績計算結果格納配列
        this.timeData = []; // コピー用タイムカード配列
        this.offCompDay = 0; // 代休日数
        this.offWorkDay = 0; // 休日出勤(申請)
        this.offWorkDay2 = 0; // 休日出勤(申請なし)

        // 実行
        this.calc();
        this.render();
    }

    /**
     * レンダリングに必要なデータを処理
     *
     * @memberof RakumoTimeRecorder
     */
    calc() {
        // tmp変数
        let tmpTimeCard = []; // タイムカード代入変数

        // 本日までのタイムカードデータを取得
        tmpTimeCard = this.TableParser.getAll(true);

        // 本日までの実績を計算
        const yyyymm = [this.getYear(), this.getMonth()].join('-');
        tmpTimeCard.forEach((value) => {
            const yyyymmdd = [yyyymm, this._formatDay(value[0])].join('-');
            const startTime = this._formatTime(value[1]);
            let endTime = this._formatTime(value[4]);

            // 出勤中なら現在時刻を挿入
            endTime = (yyyymmdd === this.getYYYYMMDD() && endTime === null && startTime !== null) ? this.getHHMM() : endTime;

            if (this.isOffAM(value[5])) {
                // 午前休
                this.calcData.push(this.CalcTimeCard.offAM(endTime));
            } else if (this.isOffPM(value[5])) {
                // 午後休
                this.calcData.push(this.CalcTimeCard.offPM(startTime));
            } else if (this.isOff(value[5])) {
                // 有給休暇
                this.calcData.push(this.CalcTimeCard.off());
            } else if (this.isOffComp(value[5])) {
                // 振替休日
                this.offCompDay += 1;
            } else if (this.isOffWork(value[5])) {
                // 休日出勤(申請あり)
                this.offWorkDay += 1;
                this.calcData.push(this.CalcTimeCard.offWork(startTime, endTime));
            } else {
                // 通常出勤
                if (this.isWorkDay(yyyymmdd)) {
                    this.calcData.push(this.CalcTimeCard.calc(startTime, endTime));
                }
                // 休日出勤(申請なし)
                if (!this.isWorkDay(yyyymmdd) && startTime && endTime) {
                    this.offWorkDay2 += 1;
                    this.calcData.push(this.CalcTimeCard.calc(startTime, endTime));
                }
            }
        });

        // コピー用タイムカードデータを取得
        tmpTimeCard = this.TableParser.getAll();

        // コピー用タイムカードデータを配列に格納
        tmpTimeCard.forEach((value) => {
            this.timeData.push([
                (this.isOffComp(value[5])) ? '*' : null, // 振替休日
                (this.isOffWork(value[5])) ? '*' : null, // 休日出勤(申請)
                (this.isOff(value[5])) ? '*' : null, // 有給休暇
                (this.isOffAM(value[5])) ? '*' : null, // 午前休
                this._formatTime(value[1]), // 出勤時間
                this._formatTime(value[4]), // 退勤時間
                (this.isOffPM(value[5])) ? '*' : null // 午後休
            ].join('\t'))
        });
    }

    /**
     * レンダリング
     *
     * @memberof RakumoTimeRecorder
     */
    render() {
        // コピー用のボタン生成
        const elBtn = this._createElement('button');
        const btnText = 'タイムカードを勤怠表形式でコピーする';
        elBtn.innerText = btnText;
        elBtn.style.marginBottom = '5px';
        elBtn.addEventListener('click', () => {
            this._copy(this.timeData.join('\n'));

            const el = this._createElement('span');
            el.innerHTML = ' (コピー完了！勤怠表エクセルの<b>E5セル</b>に貼り付けてください)';
            el.style.color = '#f00';
            this._after(elBtn, el);

            setTimeout(() => {
                el.parentNode.removeChild(el);
            }, 8000);
        });

        // サマリーテーブル生成
        const workDay = this.getWorkDay(); // 今月の労働日数
        const workToday = this.getWorkDay(true); // 今日までの営業日数
        const leftDay = workDay - workToday; // 残りの営業日数
        const workTime = this.CalcTimeCard.getWorkTime(); // 1日の労働時間
        const coreTime = this.CalcTimeCard.getCoreTime(); // 1日のコアタイム
        const keys = ['コア', 'コア外', '日計', 'ペナルティ', '残業', '欠勤', '有休'];
        const data = [0, 0, 0, 0, 0, 0, 0];
        const elTbl = this._createElement('div');

        // amコア, pmコア, コア外, 日計, ペナルティ, 残業, 有休
        this.calcData.forEach((v) => {
            data[0] += v[0] + v[1]; // AMコア + PMコア
            data[1] += v[2]; // コア外
            data[2] += v[3]; // 日計
            data[3] += v[4]; // ペナ
            data[4] += v[5]; // 残業
            data[5] += (v[4] === coreTime && v[2] === 0) ? 1 : 0; // ペナとコアが同じかつコア外が0なら欠勤
            data[6] += v[6]; // 有休
        });

        // 初期化
        elTbl.innerHTML = '[今月の想定] ';

        // 今月の想定
        const tmpCore = coreTime * (workDay - this.offCompDay) - data[6] * coreTime; // 月のコア = 1日のコア * (今月の営業日数 - 代休) - 有休分
        const tmpCoreOut = (workTime - coreTime) * (workDay + this.offWorkDay); // 月のコア外 = 1日のコア外 * (今月の営業日数 + 休出(申請))
        [tmpCore, tmpCoreOut, tmpCore + tmpCoreOut].forEach((v, idx) => {
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `${keys[idx]}: ${v}`;
        });

        // 営業日数
        const offWorkLabel = this.offWorkDay + this.offWorkDay2 ? `, 休出: ${this.offWorkDay}(${this.offWorkDay2})日` : '';
        const compDayLabel = this.offCompDay ? `, 代休: ${this.offCompDay}日` : '';
        elTbl.innerHTML += `, 営業日数: ${workDay}日(残り: ${leftDay}日)${offWorkLabel}${compDayLabel}`;

        const ageLabel = 'までの';
        const nowLabel = `現在${ageLabel}`;

        // 本日までの想定
        elTbl.innerHTML += `<br>[本日${ageLabel}想定] `;
        const tmpTodayCore = coreTime * (workToday - this.offCompDay) - data[6] * coreTime; // 月のコア = 1日のコア * (本日までの営業日数 - 代休) - 有休分
        const tmpTodayCoreOut = (workTime - coreTime) * (workToday + this.offWorkDay); // 月のコア外 = 1日のコア外 * (本日までの営業日数 + 休出(申請))
        [tmpTodayCore, tmpTodayCoreOut, tmpTodayCore + tmpTodayCoreOut].forEach((v, idx) => {
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `${keys[idx]}: ${v}`;
        });

        // 本日までの実績
        elTbl.innerHTML += `<br>[${nowLabel}実績] `;
        data.forEach((v, idx) => {
            v = Math.round(v * 100) / 100;
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `<span class="js${idx}">${keys[idx]}: ${v}</span>`;
        });

        // 不足分を強調
        if (tmpTodayCore > Math.round(data[0] * 100) / 100) elTbl.querySelector('.js0').style.color = 'red'; // コア
        if (tmpTodayCoreOut > Math.round(data[1] * 100) / 100) elTbl.querySelector('.js1').style.color = 'red'; // コア外

        // 表示領域確保
        const elWrap = this._createElement('div');
        elWrap.style.clear = 'both';
        elWrap.style.padding = '5px 10px';

        this._append(elWrap, elBtn);
        this._append(elWrap, elTbl);
        this._append(this._querySelector('.timeCardHeader'), elWrap);

        // fixed position top
        const elHead = this._querySelector('.tableBodyWrapper');
        const offs = elWrap.offsetHeight;
        elHead.style.top = elHead.style.top ? `${parseInt(elHead.style.top.replace('px', '')) + offs}px` : 'auto';
        elHead.style.height = elHead.style.height ? `${parseInt(elHead.style.height.replace('px', '')) - offs}px` : 'auto';
    }

    /**
     * 月の営業日数を取得
     *
     * @param {boolean} [isToday=false] trueなら本日までの営業日数を取得
     * @returns number
     * @memberof RakumoTimeRecorder
     */
    getWorkDay(isToday = false) {
        const rows = this.TableParser.getAll();
        const yyyymm = [this.getYear(), this.getMonth()].join('-');
        const today = this.getYYYYMMDD();

        let workDay = 0;

        rows.some((row) => {
            const yyyymmdd = [yyyymm, this._formatDay(row[0])].join('-');

            // 平日かつ祝日でなければカウント
            if (this.isWorkDay(yyyymmdd)) {
                workDay += 1;
            }

            return (isToday && today <= yyyymmdd) === true;
        });

        return workDay;
    }

    /**
     * 年を yyyy で取得
     *
     * @returns string
     * @memberof RakumoTimeRecorder
     */
    getYear() {
        return this._querySelector('input[type="hidden"][name="year"]').value;
    }

    /**
     * 月を mm で取得
     *
     * @returns string
     * @memberof RakumoTimeRecorder
     */
    getMonth() {
        return `0${this._querySelector('input[type="hidden"][name="month"]').value}`.slice(-2);
    }

    /**
     * ISOフォーマットのデータを取得
     *
     * @returns yyyy-mm-ddThh:mm:ss.000Z
     * @memberof RakumoTimeRecorder
     */
    getISODate() {
        const now = new Date();
        return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
    }

    /**
     * YYYYMMDDのデータを取得
     *
     * @returns yyyymmdd
     * @memberof RakumoTimeRecorder
     */
    getYYYYMMDD() {
        return this.getISODate().slice(0, 10);
    }

    /**
     * HHMMのデータを取得
     *
     * @returns string
     * @memberof RakumoTimeRecorder
     */
    getHHMM() {
        return this.getISODate().slice(11, 16);
    }

    /**
     * 営業日の判定
     *
     * @param {string} yyyymmdd
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isWorkDay(yyyymmdd) {
        return (/[1-5]/.test(new Date(yyyymmdd).getDay()) && !HOLIDAY.hasOwnProperty(yyyymmdd));
    }

    /**
     * 有給判定
     *
     * @param {string} string
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isOff(string) {
        return /休暇|有給|有休|全休/.test(string);
    }

    /**
     * 午前休判定
     *
     * @param {string} string
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isOffAM(string) {
        return /[前|AM|ＡＭ]半?休暇?/i.test(string);
    }

    /**
     * 午後休判定
     *
     * @param {string} string
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isOffPM(string) {
        return /[後|PM|ＰＭ]半?休暇?/i.test(string);
    }

    /**
     * 振替休日判定
     *
     * @param {string} string
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isOffComp(string) {
        return /[代|振替?]休/.test(string);
    }

    /**
     * 休日出勤判定
     *
     * @param {string} string
     * @returns bool
     * @memberof RakumoTimeRecorder
     */
    isOffWork(string) {
        return /休出|休日出勤/.test(string);
    }

    /**
     * 文字列から日を取得
     *
     * @param {string} string
     * @memberof RakumoTimeRecorder
     */
    _formatDay(string) {
        const matches = string.match(/[0-1]?[0-9][/|-]([0-3]?[0-9])/);
        return matches ? `0${matches[1]}`.slice(-2) : null;
    }

    /**
     * 文字列から hh:mm を取得する
     *
     * @private
     * @param {string} string
     * @returns string|null
     * @memberof TableParser
     */
    _formatTime(string) {
        const matches = string.match(/[0-2]?[0-9]:[0-5][0-9]/);
        return matches ? `0${matches[0]}`.slice(-5) : null;
    }

    /**
     * createElement
     *
     * @param {string} el 作成するelement
     * @returns
     * @memberof RakumoTimeRecorder
     */
    _createElement(el) {
        return document.createElement(el);
    }

    /**
     * querySelector
     *
     * @param {string} selector セレクター
     * @returns
     * @memberof RakumoTimeRecorder
     */
    _querySelector(selector) {
        return document.querySelector(selector);
    }

    /**
     * append
     *
     * @param {object} parent 親element
     * @param {object} el 追加するelement
     * @memberof RakumoTimeRecorder
     */
    _append(parent, el) {
        parent.appendChild(el);
    }

    /**
     * after
     *
     * @param {object} parent どのelementの後ろにafterするか
     * @param {object} el 挿入するelement
     * @memberof RakumoTimeRecorder
     */
    _after(parent, el) {
        parent.parentNode.insertBefore(el, parent.nextElementSibling);
    }

    /**
     * copy
     *
     * @param {string} value コピーする値
     * @memberof RakumoTimeRecorder
     */
    _copy(value) {
        const el = this._createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
}

/**
 * テーブル解析クラス
 *
 * @class TableParser
 */
class TableParser {
    constructor(selector) {
        this.$rows = document.querySelectorAll(selector);
        this.length = this.$rows.length;

        if (!this.length) {
            throw new Error('テーブルレコードが見つかりません');
        }

        // レコードパーサーインスタンス生成
        this.RowParser = new RowParser('td');
    }

    /**
     * レコードを全件取得
     *
     * @param {boolean} [today=false] trueなら本日までのデータを取得
     * @returns array
     * @memberof TableParser
     */
    getAll(today = false) {
        const rows = [];
        const hasClass = (el, className) => {
            return el.classList.contains(className);
        }

        Array.from(this.$rows).some((row) => {
            rows.push(this.RowParser.getAll(row));
            if (today && hasClass(row, 'today')) {
                return true;
            }
        });

        return rows;
    }

    /**
     * 指定したレコードを取得
     *
     * @param {number} offset
     * @returns array
     * @memberof TableParser
     */
    getRow(offset) {
        offset = Math.max(1, Math.min(offset, this.length));
        return this.RowParser.getAll(this.$rows[offset - 1]);
    }
}

/**
 * レコード解析クラス
 *
 * @class RowParser
 */
class RowParser {
    constructor(selector = 'td') {
        this.selector = selector;
    }

    /**
     * 配列でレコードを取得
     *
     * @returns array
     * @memberof RowParser
     */
    getAll(row) {
        return Array.from(this._parse(row)).map(cell => this._clean(cell.innerText));
    }

    /**
     * 日付を取得
     *
     * @returns string
     * @memberof RowParser
     */
    getDate(row) {
        return this._clean(this._parse(row)[0].innerText);
    }

    /**
     * 出勤時間を取得
     *
     * @returns string
     * @memberof RowParser
     */
    getStartTime(row) {
        return this._clean(this._parse(row)[1].innerText);
    }

    /**
     * 退勤時間を取得
     *
     * @returns string
     * @memberof RowParser
     */
    getEndTime(row) {
        return this._clean(this._parse(row)[2].innerText);
    }

    /**
     * 外出時間を取得
     *
     * @returns string
     * @memberof RowParser
     */
    getOutTime(row) {
        return this._clean(this._parse(row)[3].innerText);
    }

    /**
     * 帰社時間を取得
     *
     * @returns string
     * @memberof RowParser
     */
    getInTime(row) {
        return this._clean(this._parse(row)[4].innerText);
    }

    /**
     * コメントを取得
     *
     * @returns string
     * @memberof RowParser
     */
    getComment(row) {
        return this._clean(this._parse(row)[5].innerText);
    }

    /**
     * レコードをパース
     *
     * @param {object} row
     * @returns array
     * @memberof RowParser
     */
    _parse(row) {
        const $cells = row.querySelectorAll(this.selector);
        if (!$cells.length) {
            return [];
        }
        return $cells;
    }

    /**
     * 不要な文字列を排除
     *
     * @private
     * @param {string} string
     * @returns string|null
     * @memberof RowParser
     */
    _clean(string) {
        if (typeof string === 'string') {
            return string.replace(/[\r\n]+/g, '').replace(' ', '').trim();
        }
        return null;
    }
}

req('GET', `https://gist.githubusercontent.com/tsubasa/e4950c89550fade82e91c5b9cbc5cd31/raw?_=${new Date().getTime()}`);
