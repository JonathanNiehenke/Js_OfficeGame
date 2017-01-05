let db = console.log;
let ENGINE = {
    Tile: {},
    Levels: undefined,  // Will hold function generator after init();
    Environment: {},
    keyInput: {
        // 27: "escape",
        37: [0, -1], // Left Arrow
        38: [-1, 0], // Up Arrow
        39: [0, 1],  // Right Arrow
        40: [1, 0],  // Left Arrow
        handle: function(keyEvent) {
            let Movement = this.keyInput[keyEvent.keyCode];
            if (Movement) {
                let moveTo = [this.Environment.player[0] + Movement[0],
                              this.Environment.player[1] + Movement[1]];
                let cellTo = this.Environment.cell[moveTo];
                let cellAction = this.Tile[cellTo].action;
                if (moveTo in this.Environment.cell &&
                        cellAction)
                {
                    cellAction.call(this, moveTo);
                }
            }
        },
    },
    setTiles: function(Tile) {
        this.Tile = Tile;
    },
    establishEnvironment: function(Environment, Level) {
        let structureEl = document.getElementById("Structure");
        structureEl.innerHTML = "";  // Removing all decendants.
        let [Messages, Structure] = Level;
        let colLength = Structure.length;
        for (let x = 0; x < colLength; ++x) {
            let rowDiv = document.createElement("div");
            let Row = Structure[x];
            let rowLength = Row.length;
            for (let y = 0; y < rowLength; ++y) {
                let Cell = {index: [x, y], value: Row[y]};
                Environment.cell[Cell.index] = Cell.value;
                pushKey(Environment.cellLocations, Cell.value, Cell.index);
                let Tile = this.Tile[Cell.value].image.cloneNode();
                rowDiv.appendChild(Tile);
            }
            rowDiv.id = `row${x}`;
            structureEl.appendChild(rowDiv);
        }
    },
    nextEnvironment: function() {
        let Level = ENGINE.Levels.next().value;
        let Environment = {
                cell: {},
                cellLocations: {},
                onCell: ' ',
                player: [0, 0],
                end: [0, 0],
                requirements: 0
        };
        if (Level) {
            this.establishEnvironment(Environment, Level);
            startIndex = Environment.cellLocations['$'][0];
            Environment.cell[startIndex] = ' ';
            Environment.player = startIndex;
            let requirements = Environment.requirements;
            requirements += (Environment.cellLocations['e'] || []).length;
            requirements += (Environment.cellLocations['p'] || []).length;
            requirements += (Environment.cellLocations['P'] || []).length;
            endLocations = Environment.cellLocations['E'];
            endIndex = endLocations ? endLocations[0] : startIndex;
            Environment.end = endIndex;
        }
        return Environment;
    },
    replaceImage(Index, cellValue) {
        let rowDiv = document.getElementById(`row${Index[0]}`);
        let newImgEl = this.Tile[cellValue].image;
        let currentImgEl = rowDiv.getElementsByTagName("img")[Index[1]];
        rowDiv.replaceChild(newImgEl.cloneNode(), currentImgEl);
    },
    movePlayer: function(moveTo) {
        let Environment = this.Environment;
        this.replaceImage(Environment.player, Environment.onCell);
        this.replaceImage(moveTo, "$");
        Environment.onCell = Environment.cell[moveTo];
        Environment.player = moveTo;
    },
    changeRequirements: function(value) {
        let endIndex = this.Environment.end;
        this.requirements += value;
        let changeTo = this.requirements ? " " : "E";
        this.Environment.cell[endIndex] = changeTo;
        this.replaceImage(endIndex, changeTo);
    }
};
function* parseLevelFile(levelFile) {
    let fileLines = levelFile.target.result.split("\r\n");
    let Messages = [], Structure = [];
    for (let Line of fileLines) {
        let Begin = Line ? Line[0] : "";
        if (!Begin && Structure.length) {
            yield [Messages, Structure];
            // Previous references are gone.
            Messages = [];
            Structure = [];
        }
        else if (Begin == '"') {
            Messages.push(Line);
        }
        else if (Begin == "\\" || !Begin) {
            continue;
        }
        else {
            Structure.push(Line);
        }
    }
}
function handleFileEvent(fileEvent) {
    function onFileLoad(levelFile) {
        ENGINE.Levels = parseLevelFile(levelFile);
        ENGINE.Environment = ENGINE.nextEnvironment();
    }
    let levelFile = fileEvent.target.files[0];
    let Reader = new FileReader();
    if (levelFile) {
        Reader.onload = onFileLoad;
        Reader.readAsText(levelFile);
    }
}
function pushKey(obj, key, value) {
    let arr = obj[key];
    if (arr) {
        arr.push(value);
    }
    else {
        obj[key] = [value];
    }
}
function parseTiles() {
    let getImg = document.getElementById.bind(document);
    Tile = {
        "$": {image: getImg("Player"), action: undefined},
        " ": {image: getImg("Empty"), action: ENGINE.movePlayer},
        "#": {image: getImg("Wall"), action: undefined},
        ":": {image: getImg("OpenNarrow"), action: undefined},
        ";": {image: getImg("ClosedNarrow"), action: undefined},
        "@": {image: getImg("DropZone"), action: undefined},
        "a": {image: getImg("RedKey"), action: undefined},
        "b": {image: getImg("BlueKey"), action: undefined},
        "c": {image: getImg("GreenKey"), action: undefined},
        "d": {image: getImg("YellowKey"), action: undefined},
        "A": {image: getImg("RedLock"), action: undefined},
        "B": {image: getImg("BlueLock"), action: undefined},
        "C": {image: getImg("GreenLock"), action: undefined},
        "D": {image: getImg("YellowLock"), action: undefined},
        "e": {image: getImg("Source"),
              action: function(moveTo) {
                this.Environment.cell[moveTo] = " ";
                this.movePlayer(moveTo);
                this.changeRequirements(-1);
              }
        },
        "E": {image: getImg("Elevator"),
              action: function(moveTo) {
                    ENGINE.Environment = ENGINE.nextEnvironment();
              }
        },
        "f": {image: getImg("LockNumber"), action: undefined},
        "F": {image: getImg("PinLock"), action: undefined},
        "g": {image: getImg("Cart"), action: undefined},
        "G": {image: getImg("Plant"), action: undefined},
        "h": {image: getImg("Papers"), action: undefined},
        "H": {image: getImg("Desk"), action: undefined},
        "i": {image: getImg("Trash"), action: undefined},
        "I": {image: getImg("TrashCan"), action: undefined},
        "j": {image: getImg("Mop"), action: undefined},
        "J": {image: getImg("WetFloor"), action: undefined},
        "k": {image: getImg("Flashlight"), action: undefined},
        "K": {image: getImg("Darkness"), action: undefined},
        "l": {image: getImg("LightOff"), action: undefined},
        "L": {image: getImg("LightOn"), action: undefined},
        "m": {image: getImg("MotionOn"), action: undefined},
        "M": {image: getImg("MotionOff"), action: undefined},
        "n": {image: getImg("MotionNumber"), action: undefined},
        "N": {image: getImg("Signal"), action: undefined},
        "q": {image: getImg("LightPlug"), action: undefined},
        "Q": {image: getImg("Empty"), action: undefined},
        "r": {image: getImg("Computer"),
              action: function(moveTo) {
                    for (Index of this.Environment.cellLocations["p"]) {
                        this.Environment.cell[Index] = "P";
                        this.replaceImage(Index, "P");
                    }
              }
        },
        "R": {image: getImg("ComputerPlug"), action: undefined},
        "s": {image: getImg("Socket"), action: undefined},
        "S": {image: getImg("PluggedSocket"), action: undefined},
        "p": {image: getImg("PrinterX"), action: undefined},
        "P": {image: getImg("Printer"), 
              action: function(moveTo) {
                this.Environment.cell[moveTo] = "#";
                this.replaceImage(moveTo, "#");
                this.changeRequirements(-1);
              }
        },
        "0": {image: getImg("DD0"), action: undefined},
        "1": {image: getImg("DD1"), action: undefined},
        "2": {image: getImg("DD2"), action: undefined},
        "3": {image: getImg("DD3"), action: undefined},
        "4": {image: getImg("DD4"), action: undefined},
        "5": {image: getImg("DD5"), action: undefined},
        "6": {image: getImg("DD6"), action: undefined},
        "7": {image: getImg("DD7"), action: undefined},
        "8": {image: getImg("DD8"), action: undefined},
        "9": {image: getImg("DD9"), action: undefined},
    };
    return Tile;
}
function init() {
    ENGINE.setTiles(parseTiles());
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = ENGINE.keyInput.handle.bind(ENGINE);
    document.addEventListener("keydown", handleKey, false);
}
