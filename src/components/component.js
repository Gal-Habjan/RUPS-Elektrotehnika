import { Node } from "../logic/node.js";
import { ComponentDirection } from "./ComponentDirection.js";
class Component {
    constructor(
        id,
        type,
        start,
        end,
        image,
        componentObject = null,
        direction = ComponentDirection.HORIZONTAL,
        isVoltageSource = false
    ) {
        console.log(
            `Creating component: ${id} of type ${type} between ${start.id} and ${end.id}`
        );
        this.id = id;
        this.type = type;
        this.start = start;
        this.start.setup(this);
        this.end = end;
        this.end.setup(this);
        this.isVoltageSource = isVoltageSource;
        this.image = image;
        this.debug_color = 0xff0000;
        this.direction = direction;
        this.componentObject = componentObject;

        //ui
        this.properties = {
            fields: [
                { label: "Name", type: "text", key: "name" },
                {
                    label: "Resistance (Ω)",
                    type: "number",
                    key: "resistance",
                    automatic: true,
                },
                {
                    label: "Voltage Drop (V)",
                    type: "number",
                    key: "voltageDrop",
                    automatic: true,
                },
                {
                    label: "Current (A)",
                    type: "number",
                    key: "current",
                    automatic: true,
                },
                {
                    label: "Power (W)",
                    type: "number",
                    key: "power",
                    automatic: true,
                },
            ],
        };
        this.values = {
            name: "",
            voltageDrop: { value: 0, automatic: false },
            current: { value: 0, automatic: false },
            power: { value: 0, automatic: false },
            resistance: { value: 0, automatic: false },
        };
    }

    updateMove(workspace, rotate = false) {
        console.log(`Component ${this.id} moved. Updating connected nodes.`);
        this.updateLogicNodePositions(workspace, rotate);
        this.start.move();
        this.end.move();
    }
    destroy() {
        console.log(`Destroying component ${this.id}`);
        if (this.start) this.start.destroyNode();
        if (this.end) this.end.destroyNode();
    }

    updateLogicNodePositions(workspace, rotate) {
        const comp = this.componentObject.getData("logicComponent");
        if (!comp) return;
        console.log("Updating logic node positions for", comp.id);
        // derive local offsets: prefer comp-local offsets, else use half display
        const halfW = 40;
        const halfH = 40;
        let newAngle = this.componentObject.angle;
        if (rotate) {
            newAngle = (this.componentObject.angle + 90) % 360;
            workspace.tweens.add({
                targets: this.componentObject,
                angle: newAngle,
                duration: 150,
                ease: "Cubic.easeOut",
            });
            this.direction =
                this.direction == ComponentDirection.HORIZONTAL
                    ? ComponentDirection.VERTICAL
                    : ComponentDirection.HORIZONTAL;
        }
        const localStart = comp.localStart || { x: -halfW, y: 0 };
        const localEnd = comp.localEnd || { x: halfW, y: 0 };

        const rad = (newAngle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotateMatrix = (p) => ({
            x: Math.round(p.x * cos - p.y * sin),
            y: Math.round(p.x * sin + p.y * cos),
        });

        const rStart = rotateMatrix(localStart);
        console.log(newAngle, localStart, rStart);
        const rEnd = rotateMatrix(localEnd);

        const worldStart = {
            x: this.componentObject.x + rStart.x,
            y: this.componentObject.y + rStart.y,
        };
        const worldEnd = {
            x: this.componentObject.x + rEnd.x,
            y: this.componentObject.y + rEnd.y,
        };

        const snappedStart = workspace.snapToGrid(worldStart.x, worldStart.y);
        const snappedEnd = workspace.snapToGrid(worldEnd.x, worldEnd.y);

        if (comp.start) {
            comp.start.x = snappedStart.x;
            comp.start.y = snappedStart.y;
            comp.start.initX = rStart.x;
            comp.start.initY = rStart.y;
        }
        if (comp.end) {
            comp.end.x = snappedEnd.x;
            comp.end.y = snappedEnd.y;
            comp.end.initX = rEnd.x;
            comp.end.initY = rEnd.y;
        }
        console.log(rEnd);
        // debug dots are top-level objects (not children). update their positions
        const startDot = this.componentObject.getData("startDot");
        const endDot = this.componentObject.getData("endDot");
        if (startDot && comp.start) {
            startDot.x = comp.start.x;
            startDot.y = comp.start.y;
        }
        if (endDot && comp.end) {
            endDot.x = comp.end.x;
            endDot.y = comp.end.y;
        }
    }

    conducts() {}
}

export { Component };
