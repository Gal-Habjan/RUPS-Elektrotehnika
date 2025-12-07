import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";

class Voltmeter extends Component {
    static count = 0;
    static prefix = "V";

    constructor(id, start, end, componentObject = null) {
        super(
            id,
            "voltmeter",
            start,
            end,
            "src/components/voltmeter.png",
            componentObject,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.debug_color = 0x00ff00;
        this.values.name = Voltmeter.prefix + ++Voltmeter.count;
    }
}

export { Voltmeter };
