export type CardColor = 'green' | 'yellow' | 'black' | 'brown' | 'red' | 'pink' | 'blue';

export interface Card {
    value: number;
    color: CardColor;
    image: string; // SVG 경로
}

const CARD_INFO: Omit<Card, 'image'>[] = [
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

const CARD_COUNTS: Record<string, number> = {
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

export function generateDeck(): Card[] {
    const deck: Card[] = [];
    CARD_INFO.forEach((card) => {
        const key = `${card.value}_${card.color}`;
        const count = CARD_COUNTS[key] || 0;
        for (let i = 0; i < count; i++) {
            deck.push({
                ...card,
                image: `/assets/card/${key}.svg`,
            });
        }
    });
    return deck;
}

export function shuffleDeck<T>(deck: T[]): T[] {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
