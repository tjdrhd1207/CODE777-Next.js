import { Tile } from '../../hooks/useGameSocket';
import { TileCard } from './TileCard';
import Image from 'next/image';

export function PlayerStand({ name, tiles, isTurn, isBack = false, dealDir, collectDir, characterImg }: {
    name: string;
    tiles: Tile[];
    isTurn: boolean;
    isBack?: boolean;
    dealDir?: 'top' | 'left' | 'right' | 'bottom';
    collectDir?: 'top' | 'left' | 'right' | 'bottom';
    characterImg?: string;
}) {
    const animClass = collectDir
        ? `stand-collect-${collectDir}`
        : dealDir
        ? `stand-deal-${dealDir}`
        : '';

    return (
        <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isTurn ? 'ring-2 ring-[#FFD700] bg-[#FFD700]/10' : ''} ${animClass}`}>
            {characterImg && (
                <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 ${isTurn ? 'border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.6)]' : 'border-[#444]'}`}>
                    <Image src={characterImg} alt={name} fill className="object-cover" />
                </div>
            )}
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
