/* eslint-disable no-param-reassign */

// バージョン
const VERSION = '1.1.3';

// 休暇テーブル
let HOLIDAY = {};

// global functions
const cE = (el) => {
    return document.createElement(el);
}

const qS = (selector) => {
    return document.querySelector(selector);
}

const qSA = (selector) => {
    return document.querySelectorAll(selector);
}

const ap = (parent, el) => {
    parent.appendChild(el);
}

const af = (parent, el) => {
    parent.parentNode.insertBefore(el, parent.nextElementSibling);
}

const copy = (value) => {
    const el = cE('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

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
        this.CalcTimeCard = new CalcTimeCard(); // eslint-disable-line no-undef
        this.TableParser = new TableParser('.tableBody .dateRow');

        // ここからメイン
        let timecard = this.TableParser.getAll(true);
        const workDay = this.getWorkDay();
        let offWorkDay = 0;

        // 実績用タイムカード配列生成
        const calcData = [];
        const yyyymm = [this.getYear(), this.getMonth()].join('-');
        timecard.forEach((value) => {
            const yyyymmdd = [yyyymm, this._formatDay(value[0])].join('-');
            const startTime = this._formatTime(value[1]);
            let endTime = this._formatTime(value[4]);

            // 出勤中なら現在時刻を挿入
            endTime = (yyyymmdd === this.getYYYYMMDD() && endTime === null && startTime !== null) ? this.getHHMM() : endTime;

            if (this.isWorkDay(yyyymmdd)) {
                if (this.isOffAM(value[5])) {
                    calcData.push(this.CalcTimeCard.offAM(endTime));
                } else if (this.isOffPM(value[5])) {
                    calcData.push(this.CalcTimeCard.offPM(startTime));
                } else if (this.isOff(value[5])) {
                    calcData.push(this.CalcTimeCard.off());
                } else {
                    calcData.push(this.CalcTimeCard.calc(startTime, endTime));
                }
            } else if (this.isOffWork(value[5])) {
                // 休日出勤
                offWorkDay += 1;
                calcData.push(this.CalcTimeCard.calc(startTime, endTime));
            }
        });

        // TSV用のタイムカード配列
        timecard = this.TableParser.getAll();
        const timetable = [];
        timecard.forEach((value) => {
            timetable.push([
                (this.isOff(value[5])) ? '*' : null,
                (this.isOffAM(value[5])) ? '*' : null,
                this._formatTime(value[1]),
                this._formatTime(value[4]),
                (this.isOffPM(value[5])) ? '*' : null
            ].join('\t'))
        });

        // TSVコピー用のボタン生成
        const elBtn = cE('button');
        const btnText = 'タイムカードを勤怠表形式でコピーする';
        elBtn.innerText = btnText;
        elBtn.style.marginBottom = '5px';
        elBtn.addEventListener('click', () => {
            copy(timetable.join('\n'));

            const el = cE('span');
            el.innerHTML = ' (コピー完了！勤怠表エクセルの<b>G5セル</b>に貼り付けてください)';
            el.style.color = '#f00';
            af(elBtn, el);

            setTimeout(() => {
                el.parentNode.removeChild(el);
            }, 8000);
        });

        // サマリーテーブル
        const elTbl = cE('div');
        const keys = ['コア', 'コア外', '日計', 'ペナルティ', '残業', '欠勤', '有休'];
        const data = [0, 0, 0, 0, 0, 0, 0];
        const coreTime = this.CalcTimeCard.getCoreTime();
        const workTime = this.CalcTimeCard.getWorkTime();
        const leftDay = workDay - calcData.length;

        // amコア, pmコア, コア外, 日計, ペナルティ, 残業, 有休
        calcData.forEach((v) => {
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
        [coreTime * (workDay + offWorkDay) - data[6] * coreTime, (workTime - coreTime) * (workDay + offWorkDay), workTime * (workDay + offWorkDay) - data[6] * coreTime].forEach((v, idx) => {
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `${keys[idx]}: ${v}`;
        });

        // 営業日数
        const offWork = offWorkDay ? `, 休出: ${offWorkDay}日` : '';
        elTbl.innerHTML += `, 営業日数: ${workDay}日, 残り: ${leftDay}日${offWork}`;

        const age = 'までの';
        const label = `現在${age}`;
        const len = calcData.length;

        // 本日までの想定
        elTbl.innerHTML += `<br>[本日${age}想定] `;
        [coreTime * len, (workTime - coreTime) * len, workTime * len].forEach((v, idx) => {
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `${keys[idx]}: ${v}`;
        });

        // 本日までの実績
        elTbl.innerHTML += `<br>[${label}実績] `;
        data.forEach((v, idx) => {
            v = Math.round(v * 100) / 100;
            if (idx) elTbl.innerHTML += ', ';
            elTbl.innerHTML += `<span class="js${idx}">${keys[idx]}: ${v}</span>`;
        });

        // 不足分を強調
        if (coreTime * len > Math.round(data[0] * 100) / 100) elTbl.querySelector('.js0').style.color = 'red'; // コア
        if ((workTime - coreTime) * len > Math.round(data[1] * 100) / 100) elTbl.querySelector('.js1').style.color = 'red'; // コア外

        // 追加領域のラッパー
        const elWrap = cE('div');
        elWrap.style.clear = 'both';
        elWrap.style.padding = '5px 10px';

        ap(elWrap, elBtn);
        ap(elWrap, elTbl);
        ap(qS('.timeCardHeader'), elWrap);

        // fixed position top
        const elHead = qS('.tableBodyWrapper');
        const offs = elWrap.offsetHeight;
        elHead.style.top = elHead.style.top ? `${parseInt(elHead.style.top.replace('px', '')) + offs}px` : 'auto';
        elHead.style.height = elHead.style.height ? `${parseInt(elHead.style.height.replace('px', '')) - offs}px` : 'auto';
    }

    /**
     * 月の営業日数を取得
     *
     * @returns number
     * @memberof RakumoTimeRecorder
     */
    getWorkDay() {
        const rows = this.TableParser.getAll();
        const yyyymm = [this.getYear(), this.getMonth()].join('-');

        let workDay = 0;

        rows.forEach((row) => {
            const yyyymmdd = [yyyymm, this._formatDay(row[0])].join('-');

            // 平日かつ祝日でなければカウント
            if (this.isWorkDay(yyyymmdd)) {
                workDay += 1;
            }
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
        return qS('input[type="hidden"][name="year"]').value;
    }

    /**
     * 月を mm で取得
     *
     * @returns string
     * @memberof RakumoTimeRecorder
     */
    getMonth() {
        return `0${qS('input[type="hidden"][name="month"]').value}`.slice(-2);
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
     * @returns string
     * @memberof TableParser
     */
    _formatTime(string) {
        const matches = string.match(/[0-2]?[0-9]:[0-5][0-9]/);
        return matches ? `0${matches[0]}`.slice(-5) : null;
    }
}

/**
 * テーブル解析クラス
 *
 * @class TableParser
 */
class TableParser {
    constructor(selector) {
        this.$rows = qSA(selector);
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

req('GET', 'https://gist.githubusercontent.com/tsubasa/e4950c89550fade82e91c5b9cbc5cd31/raw');
