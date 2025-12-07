import { Node } from "../logic/node.js";
import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";

class Ampermeter extends Component {
    static count = 0;
    static prefix = "A";

    constructor(id, start, end, componentObject = null) {
        super(
            id,
            "ampermeter",
            start,
            end,
            "src/components/ammeter.png",
            componentObject,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.values.name = Ampermeter.prefix + ++Ampermeter.count;
        this.debug_color = 0x00ff00;
    }
}

export { Ampermeter };
