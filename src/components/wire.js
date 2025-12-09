import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";
import Phaser from "phaser";
import { getClosestPointOnSegment } from "./wireHelper.js";
class Wire {
    constructor(start, end, workspace) {
        this.id = `wire_${Math.floor(Math.random() * 10000)}`;

        this.nodes = [];

        this.renderer = workspace.add.graphics();
        this.renderer.lineStyle(3, 0x000000, 1);
        this.paths = [];

        //code

        this.addNode(start);
        this.addNode(end);
    }

    addNode(node) {
        let oldWire = node.wire;
        if (oldWire) {
            for (const childNode of oldWire.nodes) {
                this.nodes.push(childNode);
                childNode.wire = this;
            }
            oldWire.nodes = [];
            oldWire.deleteWire();
        } else {
            this.nodes.push(node);
            node.wire = this;
        }
        if (this.nodes.length >= 2) {
            this.draw();
        }
    }
    removeNode(node) {
        const idx = this.nodes.indexOf(node);
        if (idx === -1) return;

        this.nodes.splice(idx, 1);
        node.wire = null;

        if (this.nodes.length >= 2) {
            this.draw();
        } else {
            this.deleteWire();
        }
    }
    getClosestPoint(x, y) {
        let closestPoint = null;
        let minDistance = Infinity;

        for (const path of this.paths) {
            for (let i = 0; i < path.length - 1; i++) {
                const segmentStart = path[i];
                const segmentEnd = path[i + 1];

                const point = getClosestPointOnSegment(
                    segmentStart.x,
                    segmentStart.y,
                    segmentEnd.x,
                    segmentEnd.y,
                    x,
                    y
                );

                const distance = Math.sqrt(
                    Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                }
            }
        }

        return { point: closestPoint, distance: minDistance };
    }
    addAdditionalPoint(node) {
        let point = this.getClosestPoint(node.x, node.y).point;
        let nodeDirections = this.getPosibleDirections(node, point);
        let path = this.getMiddlePath(node, point, nodeDirections);
        let startPoint = { x: node.x, y: node.y };
        path.unshift(startPoint);
        path.push(point);

        let previousPoint = startPoint;

        for (const point of path) {
            if (point == previousPoint) continue;
            let line = new Phaser.Geom.Line(
                previousPoint.x,
                previousPoint.y,
                point.x,
                point.y
            );

            this.renderer.strokeLineShape(line);
            previousPoint = point;
        }
        return path;
    }

    draw() {
        this.paths = [];
        this.renderer.clear();
        this.renderer.lineStyle(3, 0x000000, 1);
        if (this.nodes.length < 2) return;

        this.paths.push(this.initialDraw(this.nodes[0], this.nodes[1]));
        for (let i = 2; i < this.nodes.length; i++) {
            this.paths.push(this.addAdditionalPoint(this.nodes[i]));
        }
    }

    deleteWire() {
        this.renderer.clear();

        for (const comp of this.nodes) {
            comp.wire = null;
        }
        this.renderer.destroy();
    }
    initialDraw(start, end) {
        let directionsStart = this.getPosibleDirections(start, end);
        let directionsEnd = this.getPosibleDirections(end, start);

        const startPosition = {
            x: start.x,
            y: start.y,
        };
        const endPosition = { x: end.x, y: end.y };

        let path = this.getPath(
            startPosition,
            endPosition,
            directionsStart,
            directionsEnd,
            start.component && start.component.direction,
            end.component && end.component.direction
        );
        path.unshift(startPosition);
        path.push(endPosition);

        let previousPoint = startPosition;

        for (const point of path) {
            if (point == previousPoint) continue;
            let line = new Phaser.Geom.Line(
                previousPoint.x,
                previousPoint.y,
                point.x,
                point.y
            );

            this.renderer.strokeLineShape(line);
            previousPoint = point;
        }
        return path;
    }

    getPath(start, end, directionsStart, directionsEnd, startDir, endDir) {
        let path = [];

        if (start.x == end.x) {
            if (
                (directionsStart.includes("UP") &&
                    directionsEnd.includes("DOWN") &&
                    start.y >= end.y) ||
                (directionsStart.includes("DOWN") &&
                    directionsEnd.includes("UP") &&
                    start.y <= end.y)
            ) {
                return path;
            }

            path.push({ x: start.x + 40, y: start.y });
            path.push({ x: end.x + 40, y: end.y });
            return path;
        }
        if (start.y == end.y) {
            if (
                (directionsStart.includes("LEFT") &&
                    directionsEnd.includes("RIGHT") &&
                    start.x > end.x) ||
                (directionsStart.includes("RIGHT") &&
                    directionsEnd.includes("LEFT") &&
                    start.x < end.x)
            ) {
                return path;
            }
            path.push({ x: start.x, y: start.y + 40 });
            path.push({ x: end.x, y: end.y + 40 });
            return path;
        }

        const orderedDirections = (dirs, dirHint) => {
            if (!Array.isArray(dirs)) return [];
            if (dirHint === ComponentDirection.HORIZONTAL) {
                const out = [];
                ["LEFT", "RIGHT", "UP", "DOWN"].forEach((d) => {
                    if (dirs.includes(d)) out.push(d);
                });
                return out;
            }
            if (dirHint === ComponentDirection.VERTICAL) {
                const out = [];
                ["UP", "DOWN", "LEFT", "RIGHT"].forEach((d) => {
                    if (dirs.includes(d)) out.push(d);
                });
                return out;
            }
            return dirs.slice();
        };

        const tryTwoStep = () => {
            const dirsToCheck = orderedDirections(directionsStart, startDir);
            for (const dir of dirsToCheck) {
                if (dir == "LEFT" || dir == "RIGHT") {
                    let finalMidPoint = { x: (start.x + end.x) / 2, y: end.y };
                    if (
                        (finalMidPoint.x > end.x &&
                            directionsEnd.includes("RIGHT")) ||
                        (finalMidPoint.x < end.x &&
                            directionsEnd.includes("LEFT"))
                    ) {
                        return [
                            { x: (start.x + end.x) / 2, y: start.y },
                            finalMidPoint,
                        ];
                    }
                }

                if (dir == "UP" || dir == "DOWN") {
                    let finalMidPoint = { x: end.x, y: (start.y + end.y) / 2 };
                    if (
                        (finalMidPoint.y < end.y &&
                            directionsEnd.includes("UP")) ||
                        (finalMidPoint.y > end.y &&
                            directionsEnd.includes("DOWN"))
                    ) {
                        return [
                            { x: start.x, y: (start.y + end.y) / 2 },
                            finalMidPoint,
                        ];
                    }
                }
            }
            return null;
        };

        const tryOneStep = () => {
            const dirsToCheck = orderedDirections(directionsStart, startDir);
            for (const dir of dirsToCheck) {
                if (dir == "UP" || dir == "DOWN") {
                    if (
                        (start.x > end.x && directionsEnd.includes("RIGHT")) ||
                        (start.x < end.x && directionsEnd.includes("LEFT"))
                    ) {
                        return [{ x: start.x, y: end.y }];
                    }
                }

                if (dir == "LEFT" || dir == "RIGHT") {
                    if (
                        (start.y < end.y && directionsEnd.includes("UP")) ||
                        (start.y > end.y && directionsEnd.includes("DOWN"))
                    ) {
                        return [{ x: end.x, y: start.y }];
                    }
                }
            }
            return null;
        };

        let result = null;
        if (typeof startDir !== "undefined" && typeof endDir !== "undefined") {
            if (startDir !== endDir) {
                result = tryOneStep() || tryTwoStep();
            } else {
                result = tryTwoStep() || tryOneStep();
            }
        } else {
            result = tryTwoStep() || tryOneStep();
        }

        if (result) return result;

        console.error("error no path found");
        return path;
    }
    getMiddlePath(start, end, directionsStart, endDir) {
        let path = [];

        const sameAxisFallback = () => {
            if (start.x == end.x) {
                if (
                    (directionsStart.includes("UP") && start.y >= end.y) ||
                    (directionsStart.includes("DOWN") && start.y <= end.y)
                ) {
                    return null;
                }
                return [
                    { x: start.x + 40, y: start.y },
                    { x: end.x + 40, y: end.y },
                ];
            }
            if (start.y == end.y) {
                if (
                    (directionsStart.includes("LEFT") && start.x > end.x) ||
                    (directionsStart.includes("RIGHT") && start.x < end.x)
                ) {
                    return null;
                }
                return [
                    { x: start.x, y: start.y + 40 },
                    { x: end.x, y: end.y + 40 },
                ];
            }
            return null;
        };

        const tryOneStep = () => {
            for (const dir of directionsStart) {
                if (dir == "UP" || dir == "DOWN") {
                    return [{ x: start.x, y: end.y }];
                }
                if (dir == "LEFT" || dir == "RIGHT") {
                    return [{ x: end.x, y: start.y }];
                }
            }
            return null;
        };

        const tryTwoStep = () => {
            for (const dir of directionsStart) {
                if (dir == "LEFT" || dir == "RIGHT") {
                    let finalMidPoint = { x: (start.x + end.x) / 2, y: end.y };
                    return [
                        { x: (start.x + end.x) / 2, y: start.y },
                        finalMidPoint,
                    ];
                }
                if (dir == "UP" || dir == "DOWN") {
                    let finalMidPoint = { x: end.x, y: (start.y + end.y) / 2 };
                    return [
                        { x: start.x, y: (start.y + end.y) / 2 },
                        finalMidPoint,
                    ];
                }
            }
            return null;
        };

        const same = sameAxisFallback();
        if (same) return same;

        let result = null;
        if (
            typeof endDir !== "undefined" &&
            start.component &&
            start.component.direction !== undefined
        ) {
            if (start.component.direction !== endDir) {
                result = tryOneStep() || tryTwoStep();
            } else {
                result = tryTwoStep() || tryOneStep();
            }
        } else {
            result = tryOneStep() || tryTwoStep();
        }

        if (result) return result;

        console.error("error no path found");
        return path;
    }
    getPosibleDirections(node, targetNode) {
        let directions = [];
        let direction = node.component.direction;
        if (direction === ComponentDirection.HORIZONTAL) {
            if (node.initX > 0) {
                if (node.x <= targetNode.x) directions.push("RIGHT");
            } else {
                if (node.x >= targetNode.x) directions.push("LEFT");
            }
            if (node.y >= targetNode.y) directions.push("UP");
            if (node.y <= targetNode.y) directions.push("DOWN");
        } else {
            if (node.initY < 0) {
                if (node.y >= targetNode.y) directions.push("UP");
            } else {
                if (node.y <= targetNode.y) directions.push("DOWN");
            }
            if (node.x <= targetNode.x) directions.push("RIGHT");
            if (node.x >= targetNode.x) directions.push("LEFT");
        }
        return directions;
    }
}

export { Wire };
