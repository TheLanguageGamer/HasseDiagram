"use strict";
function enableProperty(name, value) {
    let propertyElement = document.getElementById(name);
    if (value) {
        propertyElement.style.textDecoration = "none";
        propertyElement.style.color = "#000";
    }
    else {
        propertyElement.style.textDecoration = "line-through";
        propertyElement.style.color = "#AAA";
    }
}
var NodeRelation;
(function (NodeRelation) {
    NodeRelation[NodeRelation["Disabled"] = -1] = "Disabled";
    NodeRelation[NodeRelation["Disconnected"] = 0] = "Disconnected";
    NodeRelation[NodeRelation["Connected"] = 1] = "Connected";
})(NodeRelation || (NodeRelation = {}));
class GraphFunction {
    constructor(fromGraph, toGraph, fromSetBoxIndex, toSetBoxIndex) {
        this.fromGraph = fromGraph;
        this.toGraph = toGraph;
        this.fromSetBoxIndex = fromSetBoxIndex;
        this.toSetBoxIndex = toSetBoxIndex;
    }
    update(edges, identifier) {
        let maxLength = Math.max(this.fromGraph.connections.length, this.toGraph.connections.length);
        let isTotal = true;
        let isSurjective = true;
        let nonFunctionalities = 0;
        let nonInjectivities = 0;
        for (let i = 0; i < maxLength; ++i) {
            let hasFromValue = false;
            let hasToValue = false;
            for (let j = 0; j < edges.length; ++j) {
                let edge = edges[j];
                if (edge.enabled
                    && edge.fromSetBoxIndex == this.fromSetBoxIndex
                    && edge.toSetBoxIndex == this.toSetBoxIndex) {
                    if (edge.fromIndex == i) {
                        if (hasFromValue) {
                            nonFunctionalities++;
                        }
                        hasFromValue = true;
                    }
                    if (edge.toIndex == i) {
                        if (hasToValue) {
                            nonInjectivities++;
                        }
                        hasToValue = true;
                    }
                }
            }
            if (i < this.fromGraph.connections.length
                && this.fromGraph.connections[i][i] != NodeRelation.Disabled) {
                isTotal = isTotal && hasFromValue;
            }
            if (i < this.toGraph.connections.length
                && this.toGraph.connections[i][i] != NodeRelation.Disabled) {
                isSurjective = isSurjective && hasToValue;
            }
        }
        let isFunctional = nonFunctionalities == 0;
        let isInjective = nonInjectivities == 0;
        enableProperty("functional" + identifier, isFunctional);
        enableProperty("total" + identifier, isTotal);
        enableProperty("injective" + identifier, isInjective);
        enableProperty("surjective" + identifier, isSurjective);
    }
}
class Graph {
    constructor() {
        this.connections = [];
        this.transitiveclosure = [];
        this.joins = [];
        this.meets = [];
        this.isCyclic = false;
        this.hasMeets = false;
        this.hasJoins = false;
        this.isTotalOrder = false;
        this.UNDEFINED = -2;
        this.DISABLED = -1;
    }
    expandMatrix(matrix, N) {
        while (matrix.length < N) {
            matrix.push([]);
        }
        for (let i = 0; i < matrix.length; ++i) {
            while (matrix[i].length < N) {
                matrix[i].push(NodeRelation.Disabled);
            }
        }
    }
    transitiveClosureAuxilary(i, j) {
        this.transitiveclosure[i][j] = NodeRelation.Connected;
        for (let k = 0; k < this.connections.length; ++k) {
            if (j != k && this.connections[j][k] == NodeRelation.Connected) {
                if (this.transitiveclosure[i][k] == NodeRelation.Disconnected) {
                    this.transitiveClosureAuxilary(i, k);
                }
                else if (i == k) {
                    console.log("is cyclic?", i, j, k);
                    this.isCyclic = true;
                }
            }
        }
    }
    update(elements, edges, identifier) {
        this.expandMatrix(this.connections, elements.length);
        this.expandMatrix(this.transitiveclosure, elements.length);
        this.expandMatrix(this.joins, elements.length);
        this.expandMatrix(this.meets, elements.length);
        //reset connections and transitiveclosure matrices
        for (let i = 0; i < elements.length; ++i) {
            for (let j = 0; j < elements.length; ++j) {
                if (!elements[i].enabled || !elements[j].enabled) {
                    this.connections[i][j] = NodeRelation.Disabled;
                    this.transitiveclosure[i][j] = NodeRelation.Disabled;
                    this.joins[i][j] = this.DISABLED;
                    this.meets[i][j] = this.DISABLED;
                }
                else if (i == j) {
                    this.connections[i][j] = NodeRelation.Connected;
                    this.transitiveclosure[i][j] = NodeRelation.Connected;
                    this.joins[i][j] = i;
                    this.meets[i][j] = i;
                }
                else {
                    this.connections[i][j] = NodeRelation.Disconnected;
                    this.transitiveclosure[i][j] = NodeRelation.Disconnected;
                    this.joins[i][j] = this.UNDEFINED;
                    this.meets[i][j] = this.UNDEFINED;
                }
            }
        }
        //add edges
        for (let i = 0; i < edges.length; ++i) {
            if (edges[i].enabled
                && edges[i].fromIndex > -1
                && edges[i].toIndex > -1) {
                let from = edges[i].fromIndex;
                let to = edges[i].toIndex;
                this.connections[from][to] = NodeRelation.Connected;
            }
        }
        //build transitive closure
        this.isCyclic = false;
        for (let i = 0; i < this.connections.length; ++i) {
            if (this.transitiveclosure[i][i] != NodeRelation.Disabled) {
                this.transitiveClosureAuxilary(i, i);
            }
        }
        //build meets and joins, check if total order
        this.hasMeets = true;
        this.hasJoins = true;
        this.isTotalOrder = true;
        for (let i = 0; i < elements.length; ++i) {
            for (let j = 0; j < elements.length; ++j) {
                if (this.joins[i][j] == this.DISABLED) {
                    continue;
                }
                for (let k = 0; k < this.transitiveclosure.length; ++k) {
                    if (this.transitiveclosure[i][k] == NodeRelation.Connected
                        && this.transitiveclosure[j][k] == NodeRelation.Connected
                        && (this.joins[i][j] == this.UNDEFINED
                            || this.transitiveclosure[k][this.joins[i][j]] == NodeRelation.Connected)) {
                        this.joins[i][j] = k;
                    }
                    if (this.transitiveclosure[k][i] == NodeRelation.Connected
                        && this.transitiveclosure[k][j] == NodeRelation.Connected
                        && (this.meets[i][j] == this.UNDEFINED
                            || this.transitiveclosure[this.meets[i][j]][k] == NodeRelation.Connected)) {
                        this.meets[i][j] = k;
                    }
                }
                this.hasMeets = this.hasMeets && this.meets[i][j] != this.UNDEFINED;
                this.hasJoins = this.hasJoins && this.joins[i][j] != this.UNDEFINED;
                this.isTotalOrder = this.isTotalOrder
                    && (this.transitiveclosure[i][j] != NodeRelation.Disconnected
                        || this.transitiveclosure[j][i] != NodeRelation.Disconnected);
            }
        }
        console.log("JOINS");
        for (let i = 0; i < elements.length; ++i) {
            let line = "";
            for (let j = 0; j < elements.length; ++j) {
                line += this.joins[i][j];
                line += " ";
            }
            console.log(line);
        }
        console.log("MEETS");
        for (let i = 0; i < elements.length; ++i) {
            let line = "";
            for (let j = 0; j < elements.length; ++j) {
                line += this.meets[i][j];
                line += " ";
            }
            console.log(line);
        }
        for (let i = 0; i < this.transitiveclosure.length; ++i) {
            let iIsLowerBound = true;
            let iIsUpperBound = true;
            for (let j = 0; j < this.transitiveclosure.length; ++j) {
                iIsLowerBound = iIsLowerBound
                    && (this.transitiveclosure[i][j] == NodeRelation.Connected
                        || this.transitiveclosure[i][j] == NodeRelation.Disabled);
                iIsUpperBound = iIsUpperBound
                    && (this.transitiveclosure[j][i] == NodeRelation.Connected
                        || this.transitiveclosure[j][i] == NodeRelation.Disabled);
            }
            console.log("Is", i, "a  lower bound?", iIsLowerBound);
            console.log("Is", i, "an upper bound?", iIsUpperBound);
        }
        enableProperty("antisymmetric" + identifier, !this.isCyclic);
        enableProperty("partialorder" + identifier, !this.isCyclic);
        enableProperty("hasmeets" + identifier, this.hasMeets);
        enableProperty("hasjoins" + identifier, this.hasJoins);
        enableProperty("totalorder" + identifier, this.isTotalOrder && !this.isCyclic);
    }
}
function renderEdge(ctx, cp, timeMS, edge, highlighted) {
    let margin = 8;
    let headlen = highlighted ? 12 : 6;
    ;
    let angleDelta = Math.PI / 6.0;
    let angle = Math.atan2(edge.to.y - edge.from.y, edge.to.x - edge.from.x);
    let length = calculateDistance(edge.from, edge.to);
    if (length < 8) {
        return;
    }
    let to = {
        x: edge.to.x - margin * Math.cos(angle),
        y: edge.to.y - margin * Math.sin(angle),
    };
    let from = {
        x: edge.from.x + margin * Math.cos(angle),
        y: edge.from.y + margin * Math.sin(angle),
    };
    let midPoint = {
        x: from.x + (to.x - from.x) / 2.0,
        y: from.y + (to.y - from.y) / 2.0,
    };
    if (edge.functional) {
        ctx.setLineDash([10, 5]);
    }
    ctx.strokeStyle = Constants.Colors.Black;
    ctx.fillStyle = Constants.Colors.Black;
    ctx.lineWidth = highlighted ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x - (headlen / 2) * Math.cos(angle), to.y - (headlen / 2) * Math.sin(angle));
    // ctx.quadraticCurveTo(
    // 	midPoint.x + (length/4)*Math.cos(angle+Math.PI/2),
    // 	midPoint.y + (length/4)*Math.sin(angle+Math.PI/2),
    // 	to.x - (headlen/2)*Math.cos(angle),
    // 	to.y - (headlen/2)*Math.sin(angle)
    // );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(angle - angleDelta), to.y - headlen * Math.sin(angle - angleDelta));
    ctx.lineTo(to.x - headlen * Math.cos(angle + angleDelta), to.y - headlen * Math.sin(angle + angleDelta));
    ctx.lineTo(to.x, to.y);
    ctx.fill();
    ctx.setLineDash([]);
    //ctx.stroke();
}
class FunctionManager {
    constructor(layout, children, onChange) {
        this.edges = [];
        this.drawingEdgeIndex = -1;
        this.lastMouseDownTimeStamp = performance.now();
        this.layout = layout;
        this.children = children;
        this.onChange = onChange;
    }
    render(ctx, cp, timeMS) {
        for (let i = 0; i < this.edges.length; ++i) {
            let edge = this.edges[i];
            if (edge.enabled) {
                renderEdge(ctx, cp, timeMS, edge, i == this.drawingEdgeIndex);
            }
        }
    }
    addEdge(point, from, fromIndex, fromSetBoxIndex) {
        let ret = -1;
        let filled = false;
        // for (let i = 0; i < this.edges.length; ++i) {
        // 	let edge = this.edges[i];
        // 	if (edge.enabled) {
        // 		continue;
        // 	}
        // 	filled = true;
        // 	ret = i;
        // 	edge.enabled = true;
        // 	edge.from.x = from.x;
        // 	edge.from.y = from.y;
        // 	edge.to.x = point.x;
        // 	edge.to.y = point.y;
        // 	edge.fromIndex = fromIndex;
        // 	edge.toIndex = -1;
        // 	break;
        // }
        if (!filled) {
            this.edges.push({
                fromSetBoxIndex: fromSetBoxIndex,
                toSetBoxIndex: -1,
                fromIndex: fromIndex,
                toIndex: -1,
                from: {
                    x: from.x,
                    y: from.y,
                },
                to: point,
                enabled: true,
                functional: false,
            });
            ret = this.edges.length - 1;
        }
        return ret;
    }
    onMouseDown(e) {
        let point = {
            x: e.offsetX,
            y: e.offsetY,
        };
        for (let i = 0; i < this.children.length; ++i) {
            let setbox = this.children[i];
            if (!setbox.layout.containsPosition(e.offsetX, e.offsetY)) {
                continue;
            }
            let elementIndex = setbox.selectElement(point);
            let edgeIndex = setbox.selectEdge(point);
            if (edgeIndex > -1) {
                if (performance.now() - this.lastMouseDownTimeStamp < 300) {
                    setbox.edges[setbox.selectedEdgeIndex].enabled = false;
                    setbox.onChange(setbox.elements, setbox.edges);
                    setbox.selectedEdgeIndex = -1;
                }
                else {
                    setbox.selectedEdgeIndex = edgeIndex;
                    setbox.selectedElementIndex = -1;
                }
            }
            else if (elementIndex > -1) {
                if (performance.now() - this.lastMouseDownTimeStamp < 300) {
                    setbox.deleteElement(elementIndex);
                    setbox.onChange(setbox.elements, setbox.edges);
                    setbox.selectedElementIndex = -1;
                }
                else {
                    setbox.selectedElementIndex = elementIndex;
                    setbox.selectedEdgeIndex = -1;
                    this.drawingEdgeIndex = this.addEdge(point, setbox.elements[elementIndex], elementIndex, i);
                }
            }
            else {
                setbox.selectedElementIndex = setbox.addElement(point);
                setbox.selectedEdgeIndex = -1;
                setbox.onChange(setbox.elements, setbox.edges);
            }
            this.lastMouseDownTimeStamp = performance.now();
            return true;
        }
        return false;
    }
    onMouseMove(e) {
        if (this.drawingEdgeIndex > -1) {
            let drawingEdge = this.edges[this.drawingEdgeIndex];
            drawingEdge.to.x = e.offsetX;
            drawingEdge.to.y = e.offsetY;
            for (let i = 0; i < this.children.length; ++i) {
                let setbox = this.children[i];
                if (drawingEdge.fromSetBoxIndex == i) {
                    drawingEdge.functional =
                        !setbox.layout.containsPosition(e.offsetX, e.offsetY);
                }
                let index = setbox.selectElement(drawingEdge.to);
                if (index > -1
                    && !(drawingEdge.fromIndex == index
                        && drawingEdge.fromSetBoxIndex == i)) {
                    setbox.secondaryIndex = index;
                    return true;
                }
                else {
                    setbox.secondaryIndex = -1;
                }
            }
        }
        return false;
    }
    onMouseUp(e) {
        if (this.drawingEdgeIndex > -1) {
            let drawingEdge = this.edges.pop();
            this.drawingEdgeIndex = -1;
            let length = calculateDistance(drawingEdge.from, drawingEdge.to);
            let edgeWasUsed = false;
            for (let i = 0; i < this.children.length; ++i) {
                let setbox = this.children[i];
                setbox.selectedElementIndex = -1;
                if (setbox.secondaryIndex > -1) {
                    drawingEdge.to.x = setbox.elements[setbox.secondaryIndex].x;
                    drawingEdge.to.y = setbox.elements[setbox.secondaryIndex].y;
                    drawingEdge.toIndex = setbox.secondaryIndex;
                    drawingEdge.toSetBoxIndex = i;
                    setbox.secondaryIndex = -1;
                    edgeWasUsed = true;
                    if (drawingEdge.fromSetBoxIndex == i) {
                        setbox.edges.push(drawingEdge);
                        setbox.onChange(setbox.elements, setbox.edges);
                    }
                    else {
                        this.edges.push(drawingEdge);
                        this.onChange(this.edges);
                    }
                }
            }
            if (!edgeWasUsed) {
                drawingEdge.enabled = false;
            }
            return true;
        }
        else {
            for (let i = 0; i < this.children.length; ++i) {
                let setbox = this.children[i];
                setbox.selectedElementIndex = -1;
            }
        }
        return false;
    }
}
class SetBox {
    // lastClick : DOMHighResTimeStamp = performance.now();
    constructor(layout, identifier, onChange) {
        this.children = [];
        this.elements = [];
        this.selectedElementIndex = -1;
        this.secondaryIndex = -1;
        this.edges = [];
        this.selectedEdgeIndex = -1;
        this.layout = layout;
        this.identifier = identifier;
        this.onChange = onChange;
        let textBox = new TextBox(new Layout(0, 0, 10, 10, 0, 0, 30, 30), this.identifier);
        textBox.fillStyle = Constants.Colors.Grey;
        textBox.setFontSize(18);
        this.children = [];
        this.children.push(textBox);
    }
    render(ctx, cp, timeMS) {
        ctx.strokeStyle = Constants.Colors.LightGrey;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.layout.computed.size.height);
        ctx.stroke();
        ctx.fillStyle = Constants.Colors.Black;
        for (let i = 0; i < this.elements.length; ++i) {
            let element = this.elements[i];
            if (element.enabled) {
                ctx.strokeStyle = Constants.Colors.Black;
                ctx.beginPath();
                ctx.ellipse(element.x, element.y, 5, 5, 0, 0, Math.PI * 2.0);
                ctx.fill();
            }
            if (i == this.selectedElementIndex
                || i == this.secondaryIndex) {
                ctx.strokeStyle = (i == this.selectedElementIndex)
                    ? Constants.Colors.Black
                    : Constants.Colors.DarkGrey;
                ctx.beginPath();
                ctx.ellipse(element.x, element.y, 8, 8, 0, 0, Math.PI * 2.0);
                ctx.stroke();
                ctx.closePath();
            }
        }
        for (let i = 0; i < this.edges.length; ++i) {
            let edge = this.edges[i];
            if (edge.enabled) {
                renderEdge(ctx, cp, timeMS, edge, i == this.selectedEdgeIndex);
            }
        }
    }
    selectElement(point) {
        for (let i = 0; i < this.elements.length; ++i) {
            let element = this.elements[i];
            if (!element.enabled) {
                continue;
            }
            let d = calculateDistance(element, point);
            if (d < 12) {
                return i;
            }
        }
        return -1;
    }
    selectEdge(point) {
        for (let i = 0; i < this.edges.length; ++i) {
            let edge = this.edges[i];
            let length = calculateDistance(edge.to, edge.from);
            let numerator = Math.abs((edge.to.x - edge.from.x) * (edge.from.y - point.y)
                - (edge.from.x - point.x) * (edge.to.y - edge.from.y));
            let distance = numerator / length;
            if (distance <= 8
                && calculateDistance(edge.from, point) + 8 < length
                && calculateDistance(edge.to, point) + 8 < length) {
                return i;
            }
        }
        return -1;
    }
    addElement(point) {
        let ret = -1;
        let filled = false;
        for (let i = 0; i < this.elements.length; ++i) {
            let element = this.elements[i];
            if (element.enabled) {
                continue;
            }
            filled = true;
            ret = i;
            element.enabled = true;
            element.x = point.x;
            element.y = point.y;
            break;
        }
        if (!filled) {
            this.elements.push({
                x: point.x,
                y: point.y,
                enabled: true,
            });
            ret = this.elements.length - 1;
        }
        return ret;
    }
    deleteElement(index) {
        console.assert(index >= 0 && index < this.elements.length);
        this.elements[index].enabled = false;
        for (let i = 0; i < this.edges.length; ++i) {
            if (this.edges[i].fromIndex == index
                || this.edges[i].toIndex == index) {
                this.edges[i].enabled = false;
                this.edges[i].fromIndex = -1;
                this.edges[i].toIndex = -1;
            }
        }
    }
}
class Main {
    constructor(container) {
        this.game = new Game(container, {});
        let graphP = new Graph();
        let setBoxPLayout = new Layout(0, 0, 20, 50, 0.5, 0.8, -30, -50);
        let setBoxP = new SetBox(setBoxPLayout, "P", function (elements, edges) {
            graphP.update(elements, edges, "P");
        });
        let graphQ = new Graph();
        let setBoxQLayout = new Layout(0.5, 0, 10, 50, 0.5, 0.8, -30, -50);
        let setBoxQ = new SetBox(setBoxQLayout, "Q", function (elements, edges) {
            graphQ.update(elements, edges, "Q");
        });
        let f = new GraphFunction(graphP, graphQ, 0, 1);
        let g = new GraphFunction(graphQ, graphP, 1, 0);
        let functionManager = new FunctionManager(new Layout(0, 0, 0, 0, 1, 1, 0, 0), [setBoxP, setBoxQ], function (edges) {
            f.update(edges, "F");
            g.update(edges, "G");
        });
        // let textLayout3 = new Layout(
        // 	0, 0, 5, 5,
        // 	1, 1, -10, -10
        // );
        // let textInput3 = new TextInput(textLayout3, {}, "Hey how's it going");
        // textInput3.fillStyle = Constants.Colors.Black;
        // textInput3.setFontSize(14);
        // setBox1.children.push(textInput3);
        // this.game.components.push(setBoxP);
        // this.game.components.push(setBoxQ);
        this.game.components.push(functionManager);
        this.game.doLayout();
    }
}
let $container = document.getElementById('container');
let main = new Main($container);
main.game.start();
//# sourceMappingURL=main.js.map