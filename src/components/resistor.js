import { Component } from "./component";
import { ComponentDirection } from "./ComponentDirection.js";
class Resistor extends Component {
    constructor(id, start, end, ohm, obj) {
        super(
            id,
            "resistor",
            start,
            end,
            "src/components/resistor.png",
            obj,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.ohm = ohm;
    }
}

export { Resistor };
