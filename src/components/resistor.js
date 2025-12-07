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

    calc_current() {
        if (this.voltage !== 0 && this.ohm !== 0) {
            this.current = this.voltage / this.ohm;
        } else {
            this.current = 0;
        }
    }

    calc_resistance() {
        if (this.current !== 0) {
            this.ohm = this.voltage / this.current;
        } else {
            this.ohm = Infinity;
        }
    }

    calc_voltage() {
        this.voltage = this.current * this.ohm;
    }   

    calc_power() {
        this.power = this.voltage * this.current;
    }
}

export { Resistor };
