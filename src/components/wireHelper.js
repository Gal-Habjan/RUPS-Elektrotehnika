export function getClosestPointOnSegment(x1, y1, x2, y2, px, py) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
        return { x: x1, y: y1 };
    }

    const t = Math.max(
        0,
        Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
    );

    return {
        x: x1 + t * dx,
        y: y1 + t * dy,
    };
}
