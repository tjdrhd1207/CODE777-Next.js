import { Tile } from '../../hooks/useGameSocket';
import { TileCard } from './TileCard';

export function PlayerStand({ name, tiles, isTurn, isBack = false, dealDir, collectDir }: {
    name: string;
    tiles: Tile[];
    isTurn: boolean;
    isBack?: boolean;
    dealDir?: 'top' | 'left' | 'right' | 'bottom';
    collectDir?: 'top' | 'left' | 'right' | 'bottom';
}) {
    const animClass = collectDir
        ? `stand-collect-${collectDir}`
        : dealDir
        ? `stand-deal-${dealDir}`
        : '';

    return (
        <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isTurn ? 'ring-2 ring-[#FFD700] bg-[#FFD700]/10' : ''} ${animClass}`}>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isTurn ? 'bg-[#FFD700] text-black' : 'bg-[#1a2a1a] text-gray-300'}`}>
                {isTurn && '▶ '}{name}
            </span>
            <div className="flex gap-2">
                {isBack
                    ? [0, 1, 2].map(i => <TileCard key={i} isBack />)
                    : tiles.map((tile, i) => <TileCard key={i} tile={tile} />)
                }
            </div>
        </div>
    );
}
