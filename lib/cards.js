const CARD_INFO = [
    { value: 1, color: 'green' },
    { value: 2, color: 'yellow' },
    { value: 3, color: 'black' },
    { value: 4, color: 'brown' },
    { value: 5, color: 'black' },
    { value: 5, color: 'red' },
    { value: 6, color: 'green' },
    { value: 6, color: 'pink' },
    { value: 7, color: 'blue' },
    { value: 7, color: 'pink' },
    { value: 7, color: 'yellow' },
];

const CARD_COUNTS = {
    '1_green':  1,
    '2_yellow': 2,
    '3_black':  3,
    '4_brown':  4,
    '5_black':  1,
    '5_red':    4,
    '6_green':  3,
    '6_pink':   3,
    '7_blue':   4,
    '7_pink':   1,
    '7_yellow': 2,
};

function generateDeck() {
    const deck = [];
    CARD_INFO.forEach((card) => {
        const key = `${card.value}_${card.color}`;
        const count = CARD_COUNTS[key] || 0;
        for (let i = 0; i < count; i++) {
            deck.push({ ...card, image: `/assets/card/${key}.svg` });
        }
    });
    return deck;
}

function shuffleDeck(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const QUESTION_CARDS = [
    { seq: 1,  question: '숫자의 합이 18 이상인 선반은 몇 개입니까?' },
    { seq: 2,  question: '숫자의 합이 12 이하인 선반은 몇 개입니까?' },
    { seq: 3,  question: '숫자는 같고 색깔은 다른 타일이 있는 받침대는 몇 개입니까?' },
    { seq: 4,  question: '3개의 타일이 모두 색깔이 다른 받침대는 몇 개입니까?' },
    { seq: 5,  question: '짝수만 있거나 홀수만 있는 받침대는 몇 개입니까?' },
    { seq: 6,  question: '색깔과 숫자 모두 완전히 같은 타일이 있는 받침대는 몇 개입니까?' },
    { seq: 7,  question: '3개의 타일이 연속된 숫자인 받침대는 몇 개입니까?' },
    { seq: 8,  question: '몇 가지 색깔이 보입니까?' },
    { seq: 9,  question: '세번 이상 보이는 색깔은 몇개입니까?' },
    { seq: 10, question: '하나도 보이지 않는 숫자는 몇 개입니까?' },
    { seq: 11, question: '녹색 1, 검정 5, 분홍 7이 총 몇개 보입니까?' },
    { seq: 12, question: '3과 분홍6 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 13, question: '녹색 6과 노랑 7 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 14, question: '노랑 2와 노랑 7 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 15, question: '분홍 6와 노랑 6 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 16, question: '파랑 7과 다른 색깔 7 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 17, question: '갈색과 파랑 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 18, question: '빨강과 분홍 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 19, question: '녹색과 파랑 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 20, question: '노랑과 분홍 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 21, question: '검정과 갈색 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 22, question: '검정과 빨강 중에서 어느 것이 더 많이 보입니까?' },
    { seq: 23, question: '녹색과 노랑 중에서 어느 것이 더 많이 보입니까?' },
];

module.exports = { generateDeck, shuffleDeck, QUESTION_CARDS };
