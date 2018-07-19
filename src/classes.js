/**
 * 労働時間を計算するクラス
 *
 * @class CalcTimeCard
 */
class CalcTimeCard {
    constructor() {
        this.WORK_TIME = 8;
        this.AM_CORE = 2;
        this.PM_CORE = 2;
        this.START_TIME = '09:30';
        this.END_TIME = '18:30';
        this.AM_CORE_START = '11:00';
        this.AM_CORE_END = '13:00';
        this.PM_CORE_START = '14:00';
        this.PM_CORE_END = '16:00';
    }

    /**
     * 初期化
     *
     * @memberof CalcTimeCard
     */
    init() {
        this.dayWork = 0;
        this.amWork = 0;
        this.amCore = this.AM_CORE;
        this.pmWork = 0;
        this.pmCore = this.PM_CORE;
        this.penalty = this.AM_CORE + this.PM_CORE;
        this.overtime = 0;
    }

    /**
     * 有給休暇計算
     *
     * @returns array
     * @memberof CalcTimeCard
     */
    off() {
        return this.calc(this.START_TIME, this.END_TIME, 1);
    }

    /**
     * 午前休計算
     *
     * @param {*} end hh:mm 退勤時間
     * @returns array
     * @memberof CalcTimeCard
     */
    offAM(end) {
        return this.calc(this.START_TIME, end, 0.5);
    }

    /**
     * 午後休計算
     *
     * @param {*} start hh:mm 出勤時間
     * @returns array
     * @memberof CalcTimeCard
     */
    offPM(start) {
        return this.calc(start, this.END_TIME, 0.5);
    }

    /**
     * 労働時間を計算
     *
     * @param {*} start hh:mm 出勤時間
     * @param {*} end hh:mm 退勤時間
     * @param {number} offDay 有休消費数 [1 or 0.5 or 0]
     * @returns array
     * @memberof CalcTimeCard
     */
    calc(start, end, offDay = 0) {
        this.init();

        const amStart = this.AM_CORE_START; // 午前のコア開始時刻
        const amEnd = this.AM_CORE_END; // 午前のコア終了時刻
        const pmStart = this.PM_CORE_START; // 午後ののコア開始時刻
        const pmEnd = this.PM_CORE_END; // 午後のコア終了時刻
        let amWorkTime = 0; // 午前中の労働時間
        let pmWorkTime = 0; // 午後の労働時間

        start = start ? start : amEnd; // eslint-disable-line no-unneeded-ternary, no-param-reassign
        end = end ? end : pmStart; // eslint-disable-line no-unneeded-ternary, no-param-reassign

        // 午後のコア開始までに退勤
        if (this._diff(end, pmStart) <= 0) {
            // 労働時間を分で取得
            amWorkTime = this._diff(end, start);

            // ランチタイム算出
            const tmp = this._diff(end, amEnd);
            if (tmp > 0 && amWorkTime > 0) {
                amWorkTime -= tmp;
            }

        // 午前のコア終了以降に出勤
        } else if (this._diff(amEnd, start) <= 0) {
            // 労働時間を分で取得
            pmWorkTime = this._diff(end, start);

            // ランチタイム算出
            const tmp = this._diff(pmStart, start);
            if (tmp > 0 && pmWorkTime > 0) {
                pmWorkTime -= tmp;
            }

        // 午前中出勤かつ午後退勤
        } else if (this._diff(amEnd, start) > 0 && this._diff(end, pmStart) > 0) {
            // 労働時間を分で取得
            amWorkTime = this._diff(amEnd, start);
            pmWorkTime = this._diff(end, pmStart);
        }

        // 日計労働時間
        this.dayWork = this._round((amWorkTime + pmWorkTime) / 60);

        // コアタイム計算:午前のコアタイム開始後に退勤なら
        if (amWorkTime && this._diff(end, amStart) > 0) {
            this.amCore = this._calcCore(start, end, amStart, amEnd);
        } else {
            this.amCore = 0;
        }

        // コアタイム計算:午後のコアタイム終了前に出勤なら
        if (pmWorkTime && this._diff(pmEnd, start) > 0) {
            this.pmCore = this._calcCore(start, end, pmStart, pmEnd);
        } else {
            this.pmCore = 0;
        }

        // ペナルティ計算
        this.penalty = this._round(this.penalty - (this.amCore + this.pmCore));

        // 残業計算
        this.overtime = (this.dayWork - this.WORK_TIME) > 0 ? this._round(this.dayWork - this.WORK_TIME) : 0;

        // amコア, pmコア, コア外, 日計, ペナルティ, 残業, 有休
        return [this.amCore, this.pmCore, this._round(this.dayWork - (this.amCore + this.pmCore)), this.dayWork, this.penalty, this.overtime, offDay];
    }

    /**
     * コアタイムを計算
     *
     * @param {*} start 出勤時刻
     * @param {*} end 退勤時刻
     * @param {*} coreStart コア開始時刻
     * @param {*} coreEnd コア終了時刻
     * @returns
     * @memberof CalcTimeCard
     */
    _calcCore(start, end, coreStart, coreEnd) {
        // コアタイム時間中に出勤ならその時刻を代入、コア時間外ならコア開始時間を代入
        const tmpStart = (this._diff(coreStart, start) > 0) ? coreStart : start;
        // コアタイム時間中に退勤ならその時刻を代入、コア時間外ならコア終了時間を代入
        const tmpEnd = (this._diff(end, coreEnd) > 0) ? coreEnd : end;

        // コア終了からコア開始の差分を計算
        const core = this._diff(tmpEnd, tmpStart);

        return this._round(core / 60);
    }

    /**
     * 1日の労働時間を取得
     *
     * @returns
     * @memberof CalcTimeCard
     */
    getWorkTime() {
        return this.WORK_TIME;
    }

    /**
     * 1日のコアタイムを取得
     *
     * @returns
     * @memberof CalcTimeCard
     */
    getCoreTime() {
        return this.AM_CORE + this.PM_CORE;
    }

    /**
     * 差分を分で取得
     *
     * @description hh:mm - hh:mm を実行して差分を分で取得する
     * @param {*} hhmm1 hh:mmのフォーマットで時間を指定
     * @param {*} hhmm2 hh:mmのフォーマットで時間を指定
     * @returns
     * @memberof CalcTimeCard
     */
    _diff(hhmm1, hhmm2) {
        const time = new Date(2000, 1, 1, hhmm1.split(':')[0], hhmm1.split(':')[1], 0).getTime() - new Date(2000, 1, 1, hhmm2.split(':')[0], hhmm2.split(':')[1], 0).getTime();
        return time !== 0 ? time / 1000 / 60 : 0;
    }

    /**
     * 小数点第3位を四捨五入
     *
     * @param {*} value
     * @returns
     * @memberof CalcTimeCard
     */
    _round(value) {
        return Math.round(value * 100) / 100;
    }
}

export default CalcTimeCard;
