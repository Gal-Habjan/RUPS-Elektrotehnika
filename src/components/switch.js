import { Component } from "./component";
import { ComponentDirection } from "./ComponentDirection.js";

class Switch extends Component {
    constructor(id, start, end, is_on = false, componentObject = null) {
        const img = is_on
            ? "src/components/switch-on.png"
            : "src/components/switch-off.png";
        super(
            id,
            "switch",
            start,
            end,
            img,
            componentObject,
            ComponentDirection.HORIZONTAL,
            false
        );
        this.is_on = is_on;
    }
}

export { Switch };
