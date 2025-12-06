import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";
import Phaser from "phaser";
import { getClosestPointOnSegment } from "./wireHelper.js";
class Wire {
    constructor(start, end, workspace) {
        this.nodes = [];

        this.renderer = workspace.add.graphics();
        this.renderer.lineStyle(3, 0x000000, 1);
        this.paths = [];

        //code

        this.addNode(start);
        this.addNode(end);
    }

    addNode(node) {
        console.log("adding node", node);
        let oldWire = node.wire;
        if (oldWire) {
            for (const node of oldWire.nodes) {
                this.nodes.push(node);
                node.wire = this;
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

    getClosestPoint(x, y) {
        let closestPoint = null;
        let minDistance = Infinity;

        // Check each path in the paths array
        for (const path of this.paths) {
            // Check each line segment in the current path
            for (let i = 0; i < path.length - 1; i++) {
                const segmentStart = path[i];
                const segmentEnd = path[i + 1];

                // Find the closest point on this line segment to (x, y)
                const point = getClosestPointOnSegment(
                    segmentStart.x,
                    segmentStart.y,
                    segmentEnd.x,
                    segmentEnd.y,
                    x,
                    y
                );

                // Calculate distance from (x, y) to this point
                const distance = Math.sqrt(
                    Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                );

                // Update if this is the closest point found so far
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
        console.log(path);
        for (const point of path) {
            console.log(point);
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
        console.log("startDraw");
        this.paths = [];
        this.renderer.clear();
        this.renderer.lineStyle(3, 0x000000, 1);
        if (this.nodes.length < 2) return;

        this.paths.push(this.initialDraw(this.nodes[0], this.nodes[1]));
        for (let i = 2; i < this.nodes.length; i++) {
            console.log("additional node draw");
            console.log(this.paths);
            this.paths.push(this.addAdditionalPoint(this.nodes[i]));
        }
    }

    deleteWire() {
        console.log("DELETE");
        this.renderer.clear();

        for (const comp of this.nodes) {
            comp.wire = null;
        }
        this.renderer.destroy();
    }
    initialDraw(start, end) {
        console.log("starting initial draw of wire", end.x, end.y);

        let directionsStart = this.getPosibleDirections(start, end);
        let directionsEnd = this.getPosibleDirections(end, start);

        // Use globalX and globalY for start and end nodes
        const startPosition = {
            x: start.x,
            y: start.y,
        };
        const endPosition = { x: end.x, y: end.y };

        let path = this.getPath(
            startPosition,
            endPosition,
            directionsStart,
            directionsEnd
        );
        path.unshift(startPosition);
        path.push(endPosition);

        let previousPoint = startPosition;
        console.log(path);
        for (const point of path) {
            console.log(point);
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

    getPath(start, end, directionsStart, directionsEnd) {
        let path = [];
        console.log("Calculating path from", start, "to", end);
        console.log(
            start.x,
            end.x,
            start.y,
            end.y,
            directionsStart,
            directionsEnd
        );
        if (start.x == end.x) {
            if (
                (directionsStart.includes("UP") &&
                    directionsEnd.includes("DOWN") &&
                    start.y >= end.y) ||
                (directionsStart.includes("DOWN") &&
                    directionsEnd.includes("UP") &&
                    start.y <= end.y)
            ) {
                console.log("same x axis looking towards each other");
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
                console.log("same y axis looking towards each other");
                return path;
            }
            path.push({ x: start.x, y: start.y + 40 });
            path.push({ x: end.x, y: end.y + 40 });
            return path;
        }
        for (const dir of directionsStart) {
            if (dir == "LEFT" || dir == "RIGHT") {
                let finalMidPoint = { x: (start.x + end.x) / 2, y: end.y };
                if (
                    (finalMidPoint.x > end.x &&
                        directionsEnd.includes("RIGHT")) ||
                    (finalMidPoint.x < end.x && directionsEnd.includes("LEFT"))
                ) {
                    path.push({ x: (start.x + end.x) / 2, y: start.y });
                    path.push(finalMidPoint);
                    console.log("2 snaps horizontal");
                    return path;
                }
            }

            if (dir == "UP" || dir == "DOWN") {
                let finalMidPoint = { x: end.x, y: (start.y + end.y) / 2 };
                if (
                    (finalMidPoint.y < end.y && directionsEnd.includes("UP")) ||
                    (finalMidPoint.y > end.y && directionsEnd.includes("DOWN"))
                ) {
                    path.push({ x: start.x, y: (start.y + end.y) / 2 });
                    path.push(finalMidPoint);
                    console.log("2 snaps vertical");
                    return path;
                }
            }
        }
        for (const dir of directionsStart) {
            if (dir == "UP" || dir == "DOWN") {
                if (
                    (start.x > end.x && directionsEnd.includes("RIGHT")) ||
                    (start.x < end.x && directionsEnd.includes("LEFT"))
                ) {
                    path.push({ x: start.x, y: end.y });
                    console.log("1 snap vertical");
                    return path;
                }
            }

            if (dir == "LEFT" || dir == "RIGHT") {
                if (
                    (start.y < end.y && directionsEnd.includes("DOWN")) ||
                    (start.y > end.y && directionsEnd.includes("UP"))
                ) {
                    path.push({ x: end.x, y: start.y });
                    console.log("1 snap horizontal");
                    return path;
                }
            }
        }

        console.error("error no path found");
        return path;
    }
    getMiddlePath(start, end, directionsStart) {
        let path = [];
        // directionsStart = directionsStart.slice().reverse();
        if (start.x == end.x) {
            if (
                (directionsStart.includes("UP") && start.y >= end.y) ||
                (directionsStart.includes("DOWN") && start.y <= end.y)
            ) {
                console.log("same x axis looking towards each other");
                return path;
            }

            path.push({ x: start.x + 40, y: start.y });
            path.push({ x: end.x + 40, y: end.y });
            return path;
        }
        if (start.y == end.y) {
            if (
                (directionsStart.includes("LEFT") && start.x > end.x) ||
                (directionsStart.includes("RIGHT") && start.x < end.x)
            ) {
                console.log("same y axis looking towards each other");
                return path;
            }
            path.push({ x: start.x, y: start.y + 40 });
            path.push({ x: end.x, y: end.y + 40 });
            return path;
        }

        for (const dir of directionsStart) {
            if (dir == "UP" || dir == "DOWN") {
                path.push({ x: start.x, y: end.y });
                console.log("1 snap vertical");
                return path;
            }

            if (dir == "LEFT" || dir == "RIGHT") {
                path.push({ x: end.x, y: start.y });
                console.log("1 snap horizontal");
                return path;
            }
        }

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
            if (node.initY > 0) {
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
