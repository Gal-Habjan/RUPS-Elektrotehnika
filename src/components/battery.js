import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";

class Battery extends Component {
    static count = 0;
    static prefix = "B";

    constructor(id, start, end, voltage, componentObject = null) {
        super(
            id,
            "battery",
            start,
            end,
            "src/components/battery.png",
            componentObject,
            ComponentDirection.HORIZONTAL,
            true
        );
        this.voltage = voltage;
        this.debug_color = 0x00ff00;
        super.properties = {
            fields: [
                { label: "Name", type: "text" },

                { label: "Voltage (V)", type: "number" },
            ],
        };
        super.values = {
            name: "",
            voltage: 0,
        };
    }
}

export { Battery };
