import { Component } from "./component";
import { ComponentDirection } from "./ComponentDirection.js";
class Resistor extends Component {
    static count = 0;
    static prefix = "R";

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
        this.values.resistance.value = 100;
        Resistor.count += 1;
        this.values.name = Resistor.prefix + Resistor.count;
    }
}

export { Resistor };
