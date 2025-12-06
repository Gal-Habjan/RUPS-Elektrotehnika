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
        this.start = start; // + on voltage sources
        this.start.setup(this);
        this.end = end; // - on voltage sources
        this.end.setup(this);
        this.isVoltageSource = isVoltageSource;
        this.image = image;
        this.debug_color = 0xff0000;
        this.direction = direction;
        this.componentObject = componentObject;
        this.voltage = 0;
        this.current = 0;
        this.resistance = 0;
        this.power = 0;
    }

    updateMove() {
        console.log(`Component ${this.id} moved. Updating connected nodes.`);
        this.start.move();
        this.end.move();
    }
    destroy() {
        console.log(`Destroying component ${this.id}`);
        for (const wire of this.start.wires) {
            wire.deleteWire();
        }
        for (const wire of this.end.wires) {
            wire.deleteWire();
        }
    }

    conducts() {
        // Placeholder for component-specific conduction logic
    }
}

export { Component };
