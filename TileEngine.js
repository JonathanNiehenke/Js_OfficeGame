function pushKey(obj, key, value) {
    let arr = obj[key];
    if (arr) {
        arr.push(value);
    }
    else {
        obj[key] = [value];
    }
}

function Engine(Tile, Inventory) {
    this.Tile = Tile;
    this.Inventory = Inventory;
    this.Levels = undefined;  // Will hold function generator of levels;
    this.Environment = {};
    this.keyInput = {
        // 27: "escape",
        "38": [-1, 0], // Up Arrow
        "40": [1, 0],  // Down Arrow
        "37": [0, -1], // Left Arrow
        "39": [0, 1],  // Right Arrow
        "87": [-1, 0], // W Key (Up)
        "83": [1, 0],  // S Key (Down)
        "65": [0, -1], // A Key (Left)
        "68": [0, 1],  // D Key (Right)
        "73": [-1, 0], // I key (Up)
        "75": [1, 0],  // K Key (Down)
        "74": [0, -1], // J key (Left)
        "76": [0, 1],  // L key (Right)
        "handle": function(keyEvent) {
            let Movement = this.keyInput[keyEvent.keyCode]; if (Movement) {
                let moveTo = [
                    this.Environment.player[0] + Movement[0],
                    this.Environment.player[1] + Movement[1]];
                let cellTo = this.Environment.cell[moveTo];
                let cellAction = this.Tile[cellTo].action;
                if (moveTo in this.Environment.cell && cellAction) {
                    cellAction.call(this, moveTo, cellTo);
                }
            }
        },
    };
    this.establishEnvironment = function(Environment, Level) {
        let levelTitle = document.getElementById("levelTitle");
        let structureEl = document.getElementById("Structure");
        structureEl.innerHTML = "";  // Removing all decendants.
        let [Messages, Structure] = Level;
        levelTitle.innerHTML = Messages[0];
        let colLength = Structure.length;
        for (let x = 0; x < colLength; ++x) {
            let rowDiv = document.createElement("div");
            let Row = Structure[x];
            let rowLength = Row.length;
            for (let y = 0; y < rowLength; ++y) {
                let Cell = {"index": [x, y], "value": Row[y]};
                Environment.cell[Cell.index] = Cell.value;
                pushKey(Environment.cellLocations, Cell.value, Cell.index);
                let newTile = this.Tile[Cell.value].image.cloneNode();
                rowDiv.appendChild(newTile);
            }
            rowDiv.id = `row${x}`;
            structureEl.appendChild(rowDiv);
        }
    };
    this.nextEnvironment = function() {
        let Level = this.Levels.next().value;
        let Environment = {
            "cell": {},
            "cellLocations": {},
            "onCell": " ",
            "player": [0, 0],
            "end": [0, 0],
            "requirements": 0,
        };
        if (Level) {
            this.establishEnvironment(Environment, Level);
            startIndex = Environment.cellLocations["$"][0];
            Environment.cell[startIndex] = " ";
            Environment.player = startIndex;
            Environment.requirements = (
                (Environment.cellLocations["e"] || []).length +
                (Environment.cellLocations["p"] || []).length +
                (Environment.cellLocations["P"] || []).length)
            endLocations = Environment.cellLocations["E"];
            endIndex = endLocations ? endLocations[0] : startIndex;
            Environment.end = endIndex;
        }
        return Environment;
    };
    this.replaceImage = function(Index, cellValue) {
        let rowDiv = document.getElementById(`row${Index[0]}`);
        let newImgEl = this.Tile[cellValue].image;
        let currentImgEl = rowDiv.getElementsByTagName("img")[Index[1]];
        rowDiv.replaceChild(newImgEl.cloneNode(), currentImgEl);
    };
    this.replaceCell = function(cellIndex, cellValue) {
        this.Environment.cell[cellIndex] = cellValue;
        this.replaceImage(cellIndex, cellValue);
    };
    this.replaceAllCells = function(initalValue, newValue) {
        for (cellIndex of this.Environment.cellLocations[initalValue] || []) {
            this.replaceCell(cellIndex, newValue);
        }
    };
    this.movePlayer = function(moveTo) {
        let Environment = this.Environment;
        this.replaceImage(Environment.player, Environment.onCell);
        this.replaceImage(moveTo, "$");
        Environment.onCell = Environment.cell[moveTo];
        Environment.player = moveTo;
    };
}
