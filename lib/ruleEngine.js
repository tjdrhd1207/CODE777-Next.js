const BROWN  = 'BROWN';
const BLUE   = 'BLUE';
const RED    = 'RED';
const PINK   = 'PINK';
const GREEN  = 'GREEN';
const YELLOW = 'YELLOW';
const BLACK  = 'BLACK';

const ALL_VALUES = new Set([1, 2, 3, 4, 5, 6, 7]);

// Q17~Q23 공통 로직
function showMoreColor(players, currentTurn, color1, color2, color1Name, color2Name) {
    let count1 = 0, count2 = 0;
    players.forEach(player => {
        if (player.userId !== players[currentTurn].userId) {
            player.hand.forEach(card => {
                if (card.color === color1) count1++;
                else if (card.color === color2) count2++;
            });
        }
    });
    if (count1 > count2) return color1Name;
    if (count1 < count2) return color2Name;
    return '더 많이 보이지 않습니다.';
}

const rules = {
    // Q1: 숫자의 합이 18 이상인 받침대는 몇 개입니까?
    1: (players, currentTurn) => {
        let count = 0;
        players.forEach((player, idx) => {
            if (idx !== currentTurn) {
                const sum = player.hand.reduce((acc, card) => acc + card.value, 0);
                if (sum >= 18) count++;
            }
        });
        return count;
    },

    // Q2: 숫자의 합이 12 이하인 받침대는 몇 개입니까?
    2: (players, currentTurn) => {
        let count = 0;
        players.forEach((player, idx) => {
            if (idx !== currentTurn) {
                const sum = player.hand.reduce((acc, card) => acc + card.value, 0);
                if (sum <= 12) count++;
            }
        });
        return count;
    },

    // Q3: 숫자는 같고 색깔은 다른 타일이 있는 받침대는 몇 개입니까?
    3: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                const valueMap = new Map();
                player.hand.forEach(card => {
                    if (!valueMap.has(card.value)) valueMap.set(card.value, new Set());
                    valueMap.get(card.value).add(card.color);
                });
                let hasMatch = false;
                valueMap.forEach(colors => { if (colors.size > 1) hasMatch = true; });
                if (hasMatch) count++;
            }
        });
        return count;
    },

    // Q4: 3개의 타일이 모두 색깔이 다른 받침대는 몇 개입니까?
    4: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                const colors = new Set(player.hand.map(card => card.color));
                if (colors.size === 3) count++;
            }
        });
        return count;
    },

    // Q5: 짝수만 있거나 홀수만 있는 받침대는 몇 개입니까?
    5: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                const even = player.hand.filter(card => card.value % 2 === 0).length;
                const odd  = player.hand.filter(card => card.value % 2 !== 0).length;
                if (even === 3 || odd === 3) count++;
            }
        });
        return count;
    },

    // Q6: 색깔과 숫자 모두 완전히 같은 타일이 있는 받침대는 몇 개입니까?
    6: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                const keyMap = new Map();
                player.hand.forEach(card => {
                    const key = `${card.value}-${card.color}`;
                    keyMap.set(key, (keyMap.get(key) || 0) + 1);
                });
                let hasDupe = false;
                keyMap.forEach(cnt => { if (cnt > 1) hasDupe = true; });
                if (hasDupe) count++;
            }
        });
        return count;
    },

    // Q7: 3개의 타일이 연속된 숫자인 받침대는 몇 개입니까?
    7: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                const sorted = [...player.hand].sort((a, b) => a.value - b.value);
                const isContinuous = sorted.every((card, i) =>
                    i === 0 || card.value === sorted[i - 1].value + 1
                );
                if (isContinuous) count++;
            }
        });
        return count;
    },

    // Q8: 몇 가지 색깔이 보입니까?
    8: (players, currentTurn) => {
        const colorSet = new Set();
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => colorSet.add(card.color));
            }
        });
        return colorSet.size;
    },

    // Q9: 3번 이상 보이는 색깔은 몇 개입니까?
    9: (players, currentTurn) => {
        const colorMap = new Map();
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    colorMap.set(card.color, (colorMap.get(card.color) || 0) + 1);
                });
            }
        });
        return Array.from(colorMap.values()).filter(cnt => cnt >= 3).length;
    },

    // Q10: 하나도 보이지 않는 숫자는 몇 개입니까?
    10: (players, currentTurn) => {
        const visibleValues = new Set();
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => visibleValues.add(card.value));
            }
        });
        return Array.from(ALL_VALUES).filter(v => !visibleValues.has(v)).length;
    },

    // Q11: 녹색 1, 검정 5, 분홍 7이 총 몇 개 보입니까?
    11: (players, currentTurn) => {
        let count = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if ((card.value === 1 && card.color === GREEN) ||
                        (card.value === 5 && card.color === BLACK) ||
                        (card.value === 7 && card.color === PINK)) count++;
                });
            }
        });
        return count;
    },

    // Q12: 3과 분홍6 중에서 어느 것이 더 많이 보입니까?
    12: (players, currentTurn) => {
        let three = 0, pinkSix = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if (card.value === 3) three++;
                    else if (card.value === 6 && card.color === PINK) pinkSix++;
                });
            }
        });
        return three > pinkSix ? '3' : three < pinkSix ? '분홍 6' : '더 많이 보이지 않습니다.';
    },

    // Q13: 녹색 6과 노랑 7 중에서 어느 것이 더 많이 보입니까?
    13: (players, currentTurn) => {
        let greenSix = 0, yellowSeven = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if (card.value === 6 && card.color === GREEN) greenSix++;
                    else if (card.value === 7 && card.color === YELLOW) yellowSeven++;
                });
            }
        });
        return greenSix > yellowSeven ? '녹색 6' : greenSix < yellowSeven ? '노랑 7' : '더 많이 보이지 않습니다.';
    },

    // Q14: 노랑 2와 노랑 7 중에서 어느 것이 더 많이 보입니까?
    14: (players, currentTurn) => {
        let yellowTwo = 0, yellowSeven = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if (card.value === 2 && card.color === YELLOW) yellowTwo++;
                    else if (card.value === 7 && card.color === YELLOW) yellowSeven++;
                });
            }
        });
        return yellowTwo > yellowSeven ? '노랑 2' : yellowTwo < yellowSeven ? '노랑 7' : '더 많이 보이지 않습니다.';
    },

    // Q15: 분홍 6과 노랑 6 중에서 어느 것이 더 많이 보입니까?
    15: (players, currentTurn) => {
        let pinkSix = 0, yellowSix = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if (card.value === 6 && card.color === PINK) pinkSix++;
                    else if (card.value === 6 && card.color === YELLOW) yellowSix++;
                });
            }
        });
        return pinkSix > yellowSix ? '분홍 6' : pinkSix < yellowSix ? '노랑 6' : '더 많이 보이지 않습니다.';
    },

    // Q16: 파랑 7과 다른 색깔 7 중에서 어느 것이 더 많이 보입니까?
    16: (players, currentTurn) => {
        let blueSeven = 0, otherSeven = 0;
        players.forEach(player => {
            if (player.userId !== players[currentTurn].userId) {
                player.hand.forEach(card => {
                    if (card.value === 7 && card.color === BLUE) blueSeven++;
                    else if (card.value === 7 && card.color !== BLUE) otherSeven++;
                });
            }
        });
        return blueSeven > otherSeven ? '파랑 7' : blueSeven < otherSeven ? '다른 7' : '더 많이 보이지 않습니다.';
    },

    // Q17~Q23: 두 색깔 비교
    17: (p, t) => showMoreColor(p, t, BROWN,  BLUE,   '갈색', '파랑'),
    18: (p, t) => showMoreColor(p, t, RED,    PINK,   '빨강', '분홍'),
    19: (p, t) => showMoreColor(p, t, GREEN,  BLUE,   '녹색', '파랑'),
    20: (p, t) => showMoreColor(p, t, YELLOW, PINK,   '노랑', '분홍'),
    21: (p, t) => showMoreColor(p, t, BLACK,  BROWN,  '검정', '갈색'),
    22: (p, t) => showMoreColor(p, t, BLACK,  RED,    '검정', '빨강'),
    23: (p, t) => showMoreColor(p, t, GREEN,  YELLOW, '녹색', '노랑'),
};

function evaluate(questionSeq, players, currentTurn) {
    const rule = rules[questionSeq];
    if (!rule) return null;
    return rule(players, currentTurn);
}

// 정답 체크: 제출한 숫자 배열 vs 실제 손패 숫자 배열 비교
function checkAnswer(submittedValues, playerHand) {
    if (submittedValues.length !== playerHand.length) return false;
    const sortedSubmit = [...submittedValues].map(Number).sort((a, b) => a - b);
    const sortedHand   = [...playerHand].map(card => card.value).sort((a, b) => a - b);
    return sortedSubmit.every((v, i) => v === sortedHand[i]);
}

module.exports = { evaluate, checkAnswer };
