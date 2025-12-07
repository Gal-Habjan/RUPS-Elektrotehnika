import { Component } from "./component.js";
import { ComponentDirection } from "./ComponentDirection.js";

class Bulb extends Component {
    static count = 0;
    static prefix = "L"; // lamp

    constructor(id, start, end, componentObject = null) {
        super(
            id,
            "bulb",
            start,
            end,
            "src/components/lamp.png",
            componentObject,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.is_on = true;
        this.values.name = Bulb.prefix + ++Bulb.count;
    }

    // turnOn(){
    //     this.is_on = true;
    //     console.log(`💡 Bulb ${this.id} is now ON.`);
    // }

    // turnOff(){
    //     this.is_on = false;
    //     console.log(`💡 Bulb ${this.id} is now OFF.`);
    // }
}

export { Bulb };
