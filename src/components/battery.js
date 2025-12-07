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
        this.isAC = false;
        this.debug_color = 0x00ff00;

        this.properties = {
            fields: [
                { label: "Name", type: "text", key: "name" },
                {
                    label: "Source",
                    key: "sourceType",
                    type: "radio",
                    options: ["DC", "AC"],
                },
                {
                    label: "Voltage (V)",
                    type: "number",
                    key: "voltage",
                    automatic: false,
                },
            ],
        };
        this.values = {
            name: "Battery",
            sourceType: "DC",
            voltage: { value: voltage || 0, automatic: false },
        };
    }
}

export { Battery };
