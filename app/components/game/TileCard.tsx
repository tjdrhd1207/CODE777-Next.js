import { Tile } from '../../hooks/useGameSocket';

const TILE_BORDER: Record<string, string> = {
    GREEN:  'border-green-400',
    YELLOW: 'border-yellow-300',
    BLACK:  'border-gray-400',
    BROWN:  'border-amber-600',
    RED:    'border-red-400',
    PINK:   'border-pink-400',
    BLUE:   'border-blue-400',
};

export function TileCard({ tile, isBack = false }: { tile?: Tile; isBack?: boolean }) {
    if (isBack) {
        return (
            <div className="w-14 h-20 rounded-xl bg-[#1a1a3e] border-2 border-[#FFD700] flex items-center justify-center shadow-lg">
                <span className="text-[#FFD700] text-2xl font-black">?</span>
            </div>
        );
    }
    if (!tile) return null;
    return (
        <div className={`w-14 h-20 rounded-xl border-2 ${TILE_BORDER[tile.color] || 'border-gray-400'} bg-white flex items-center justify-center shadow-lg overflow-hidden`}>
            <img src={tile.image} alt={String(tile.value)} className="w-full h-full object-contain p-1" />
        </div>
    );
}
