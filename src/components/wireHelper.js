export function getClosestPointOnSegment(x1, y1, x2, y2, px, py) {
    // Vector from segment start to end
    const dx = x2 - x1;
    const dy = y2 - y1;

    // If the segment is a point, return that point
    if (dx === 0 && dy === 0) {
        return { x: x1, y: y1 };
    }

    // Calculate the parameter t that represents the projection of point (px, py) onto the line
    // t = 0 means the closest point is the start, t = 1 means it's the end
    const t = Math.max(
        0,
        Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
    );

    // Calculate the closest point on the segment
    return {
        x: x1 + t * dx,
        y: y1 + t * dy,
    };
}
