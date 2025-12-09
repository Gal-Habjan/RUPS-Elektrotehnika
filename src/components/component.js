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
        this.prefix = "";
        this.id = id;
        this.type = type;
        this.start = start; // + on voltage sources
        this.start.setup(this);
        this.end = end; // - on voltage sources
        this.end.setup(this);
        this.isVoltageSource = isVoltageSource;
        this.image = image;
        this.debug_color = 0xff0000;
        this.direction = direction;
        this.componentObject = componentObject;
        this.voltMeter = null;
        this.amperMeter = null;
        this.wattMeter = null;
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
                    key: "voltage",
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
                {
                    label: "Measuraments per second (Hz)",
                    type: "number",
                    key: "measuraments",
                    automatic: false,
                },
                {
                    label: "Seconds Shown (s)",
                    type: "number",
                    key: "shownTime",
                    automatic: false,
                },
            ],
        };
        this.values = {
            name: this.prefix,
            voltage: { value: 0, automatic: true },
            current: { value: 0, automatic: true },
            power: { value: 0, automatic: true },
            resistance: { value: 0, automatic: false },
            measuraments: 20,
            shownTime: 5,
        };
    }
    startInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.currentInterval = 0;
        const measuraments = this.values.measuraments || 1;
        this.intervalId = setInterval(() => {
            this.getMeasurament();
        }, 1000 / measuraments);
    }
    getMeasurament() {
        if (this.voltmeter) this.voltmeter.measure(this.values.voltage.value);
        if (this.amperMeter) this.amperMeter.measure(this.values.current.value);
        if (this.wattMeter) this.wattMeter.measure(this.values.power.value);
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
        if (this.voltmeter) this.voltmeter.destroy();
        if (this.amperMeter) this.amperMeter.destroy();
        if (this.wattMeter) this.wattMeter.destroy();
        this.voltmeter = null;
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
