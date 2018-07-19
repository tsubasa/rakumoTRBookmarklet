import CalcTimeCard from '../../src/classes';

const ctc = new CalcTimeCard();

// 09:00 ~
test('09:00-10:00', () => {
    const result = ctc.calc('09:00', '10:00');
    expect(result).toEqual([0, 0, 1, 1, 4, 0, 0]);
});

test('09:00-11:00', () => {
    const result = ctc.calc('09:00', '11:00');
    expect(result).toEqual([0, 0, 2, 2, 4, 0, 0]);
});

test('09:00-11:30', () => {
    const result = ctc.calc('09:00', '11:30');
    expect(result).toEqual([0.5, 0, 2, 2.5, 3.5, 0, 0]);
});

test('09:00-13:00', () => {
    const result = ctc.calc('09:00', '13:00');
    expect(result).toEqual([2, 0, 2, 4, 2, 0, 0]);
});

test('09:00-14:00', () => {
    const result = ctc.calc('09:00', '14:00');
    expect(result).toEqual([2, 0, 2, 4, 2, 0, 0]);
});

test('09:00-15:00', () => {
    const result = ctc.calc('09:00', '15:00');
    expect(result).toEqual([2, 1, 2, 5, 1, 0, 0]);
});

test('09:00-16:00', () => {
    const result = ctc.calc('09:00', '16:00');
    expect(result).toEqual([2, 2, 2, 6, 0, 0, 0]);
});

test('09:00-18:00', () => {
    const result = ctc.calc('09:00', '18:00');
    expect(result).toEqual([2, 2, 4, 8, 0, 0, 0]);
});

test('09:00-20:00', () => {
    const result = ctc.calc('09:00', '20:00');
    expect(result).toEqual([2, 2, 6, 10, 0, 2, 0]);
});

// 10:00 ~
test('10:00-11:00', () => {
    const result = ctc.calc('10:00', '11:00');
    expect(result).toEqual([0, 0, 1, 1, 4, 0, 0]);
});

test('10:00-11:30', () => {
    const result = ctc.calc('10:00', '11:30');
    expect(result).toEqual([0.5, 0, 1, 1.5, 3.5, 0, 0]);
});

test('10:00-13:00', () => {
    const result = ctc.calc('10:00', '13:00');
    expect(result).toEqual([2, 0, 1, 3, 2, 0, 0]);
});

test('10:00-14:00', () => {
    const result = ctc.calc('10:00', '14:00');
    expect(result).toEqual([2, 0, 1, 3, 2, 0, 0]);
});

test('10:00-15:00', () => {
    const result = ctc.calc('10:00', '15:00');
    expect(result).toEqual([2, 1, 1, 4, 1, 0, 0]);
});

test('10:00-16:00', () => {
    const result = ctc.calc('10:00', '16:00');
    expect(result).toEqual([2, 2, 1, 5, 0, 0, 0]);
});

test('10:00-18:00', () => {
    const result = ctc.calc('10:00', '18:00');
    expect(result).toEqual([2, 2, 3, 7, 0, 0, 0]);
});

test('10:00-20:00', () => {
    const result = ctc.calc('10:00', '20:00');
    expect(result).toEqual([2, 2, 5, 9, 0, 1, 0]);
});

// 11:00 ~
test('11:00-11:30', () => {
    const result = ctc.calc('11:00', '11:30');
    expect(result).toEqual([0.5, 0, 0, 0.5, 3.5, 0, 0]);
});

test('11:00-13:00', () => {
    const result = ctc.calc('11:00', '13:00');
    expect(result).toEqual([2, 0, 0, 2, 2, 0, 0]);
});

test('11:00-14:00', () => {
    const result = ctc.calc('11:00', '14:00');
    expect(result).toEqual([2, 0, 0, 2, 2, 0, 0]);
});

test('11:00-15:00', () => {
    const result = ctc.calc('11:00', '15:00');
    expect(result).toEqual([2, 1, 0, 3, 1, 0, 0]);
});

test('11:00-16:00', () => {
    const result = ctc.calc('11:00', '16:00');
    expect(result).toEqual([2, 2, 0, 4, 0, 0, 0]);
});

test('11:00-18:00', () => {
    const result = ctc.calc('11:00', '18:00');
    expect(result).toEqual([2, 2, 2, 6, 0, 0, 0]);
});

test('11:00-20:00', () => {
    const result = ctc.calc('11:00', '20:00');
    expect(result).toEqual([2, 2, 4, 8, 0, 0, 0]);
});

test('11:00-21:00', () => {
    const result = ctc.calc('11:00', '21:00');
    expect(result).toEqual([2, 2, 5, 9, 0, 1, 0]);
});

// 12:00 ~
test('12:00-13:00', () => {
    const result = ctc.calc('12:00', '13:00');
    expect(result).toEqual([1, 0, 0, 1, 3, 0, 0]);
});

test('12:00-14:00', () => {
    const result = ctc.calc('12:00', '14:00');
    expect(result).toEqual([1, 0, 0, 1, 3, 0, 0]);
});

test('12:00-15:00', () => {
    const result = ctc.calc('12:00', '15:00');
    expect(result).toEqual([1, 1, 0, 2, 2, 0, 0]);
});

test('12:00-16:00', () => {
    const result = ctc.calc('12:00', '16:00');
    expect(result).toEqual([1, 2, 0, 3, 1, 0, 0]);
});

test('12:00-18:00', () => {
    const result = ctc.calc('12:00', '18:00');
    expect(result).toEqual([1, 2, 2, 5, 1, 0, 0]);
});

test('12:00-20:00', () => {
    const result = ctc.calc('12:00', '20:00');
    expect(result).toEqual([1, 2, 4, 7, 1, 0, 0]);
});

test('12:00-22:00', () => {
    const result = ctc.calc('12:00', '22:00');
    expect(result).toEqual([1, 2, 6, 9, 1, 1, 0]);
});

// 13:00 ~
test('13:00-13:30', () => {
    const result = ctc.calc('13:00', '13:30');
    expect(result).toEqual([0, 0, 0, 0, 4, 0, 0]);
});

test('13:00-14:00', () => {
    const result = ctc.calc('13:00', '14:00');
    expect(result).toEqual([0, 0, 0, 0, 4, 0, 0]);
});

test('13:00-15:00', () => {
    const result = ctc.calc('13:00', '15:00');
    expect(result).toEqual([0, 1, 0, 1, 3, 0, 0]);
});

test('13:00-16:00', () => {
    const result = ctc.calc('13:00', '16:00');
    expect(result).toEqual([0, 2, 0, 2, 2, 0, 0]);
});

test('13:00-18:00', () => {
    const result = ctc.calc('13:00', '18:00');
    expect(result).toEqual([0, 2, 2, 4, 2, 0, 0]);
});

test('13:00-20:00', () => {
    const result = ctc.calc('13:00', '20:00');
    expect(result).toEqual([0, 2, 4, 6, 2, 0, 0]);
});

test('13:00-22:00', () => {
    const result = ctc.calc('13:00', '22:00');
    expect(result).toEqual([0, 2, 6, 8, 2, 0, 0]);
});

// 14:00 ~
test('14:00-14:30', () => {
    const result = ctc.calc('14:00', '14:30');
    expect(result).toEqual([0, 0.5, 0, 0.5, 3.5, 0, 0]);
});

test('14:00-15:00', () => {
    const result = ctc.calc('14:00', '15:00');
    expect(result).toEqual([0, 1, 0, 1, 3, 0, 0]);
});

test('14:00-16:00', () => {
    const result = ctc.calc('14:00', '16:00');
    expect(result).toEqual([0, 2, 0, 2, 2, 0, 0]);
});

test('14:00-18:00', () => {
    const result = ctc.calc('14:00', '18:00');
    expect(result).toEqual([0, 2, 2, 4, 2, 0, 0]);
});

test('14:00-20:00', () => {
    const result = ctc.calc('14:00', '20:00');
    expect(result).toEqual([0, 2, 4, 6, 2, 0, 0]);
});

test('14:00-22:00', () => {
    const result = ctc.calc('14:00', '22:00');
    expect(result).toEqual([0, 2, 6, 8, 2, 0, 0]);
});

// 15:00 ~
test('15:00-15:30', () => {
    const result = ctc.calc('15:00', '15:30');
    expect(result).toEqual([0, 0.5, 0, 0.5, 3.5, 0, 0]);
});

test('15:00-16:00', () => {
    const result = ctc.calc('15:00', '16:00');
    expect(result).toEqual([0, 1, 0, 1, 3, 0, 0]);
});

test('15:00-18:00', () => {
    const result = ctc.calc('15:00', '18:00');
    expect(result).toEqual([0, 1, 2, 3, 3, 0, 0]);
});

test('15:00-20:00', () => {
    const result = ctc.calc('15:00', '20:00');
    expect(result).toEqual([0, 1, 4, 5, 3, 0, 0]);
});

test('15:00-22:00', () => {
    const result = ctc.calc('15:00', '22:00');
    expect(result).toEqual([0, 1, 6, 7, 3, 0, 0]);
});

// 16:00 ~
test('16:00-16:30', () => {
    const result = ctc.calc('16:00', '16:30');
    expect(result).toEqual([0, 0, 0.5, 0.5, 4, 0, 0]);
});

test('16:00-18:00', () => {
    const result = ctc.calc('16:00', '18:00');
    expect(result).toEqual([0, 0, 2, 2, 4, 0, 0]);
});

test('16:00-20:00', () => {
    const result = ctc.calc('16:00', '20:00');
    expect(result).toEqual([0, 0, 4, 4, 4, 0, 0]);
});

test('16:00-22:00', () => {
    const result = ctc.calc('16:00', '22:00');
    expect(result).toEqual([0, 0, 6, 6, 4, 0, 0]);
});

// 17:00 ~
test('17:00-18:00', () => {
    const result = ctc.calc('17:00', '18:00');
    expect(result).toEqual([0, 0, 1, 1, 4, 0, 0]);
});

test('17:00-20:00', () => {
    const result = ctc.calc('17:00', '20:00');
    expect(result).toEqual([0, 0, 3, 3, 4, 0, 0]);
});

test('17:00-22:00', () => {
    const result = ctc.calc('17:00', '22:00');
    expect(result).toEqual([0, 0, 5, 5, 4, 0, 0]);
});

test('有給休暇', () => {
    const result = ctc.off();
    expect(result).toEqual([2, 2, 4, 8, 0, 0, 1]);
});

test('午前休 (18:30 退社)', () => {
    const result = ctc.offAM('18:30');
    expect(result).toEqual([2, 2, 4, 8, 0, 0, 0.5]);
});

test('午後休 (09:30 出社)', () => {
    const result = ctc.offPM('09:30');
    expect(result).toEqual([2, 2, 4, 8, 0, 0, 0.5]);
});

test('欠勤', () => {
    const result = ctc.calc();
    expect(result).toEqual([0, 0, 0, 0, 4, 0, 0]);
});
