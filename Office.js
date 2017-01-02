let db = console.log;
let GAME = {
    Tiles: {},
    Levels: undefined,  // Will hold function generator after init();
    Player: {x: 0, y: 0},
    Environment: {
            cells: {},
            cellLocations: {},
            onCell: ' ',
    },
    keyInput: {
        // 27 : "escape",
        37 : [0, -1], // Left Arrow
        38 : [-1, 0], // Up Arrow
        39 : [0, 1],  // Right Arrow
        40 : [1, 0],  // Left Arrow
        handle: function(keyEvent) {
            let Movement = this.keyInput[keyEvent.keyCode];
            if (Movement) {
                let moveTo = {x: this.Player.x + Movement[0],
                              y: this.Player.y + Movement[1]};
                this.movePlayer(moveTo);
            }
        },
    },
    populateTiles: function() {
        let tileTypes = "$ #:;@abcdABCDeEfFgGhHiIjJkKlLmMnNqQrRsSpP0123456789";
        let imageDiv = document.getElementById("tileImages");
        let tileImages = imageDiv.getElementsByTagName("img");
        let tileLength = tileImages.length;
        for (let i = 0; i < tileLength; ++i) {
            this.Tiles[tileTypes[i]] = tileImages[i];
        }
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
                Environment.cells[Cell.index] = Cell.value;
                pushKey(Environment.cellLocations, Cell.value, Cell.index);
                let Tile = this.Tiles[Cell.value].cloneNode();
                rowDiv.appendChild(Tile);
            }
            rowDiv.id = `row${x}`;
            structureEl.appendChild(rowDiv);
        }
    },
    nextEnvironment: function() {
        let Level = GAME.Levels.next().value;
        let Environment = {
                cells: {},
                cellLocations: {},
                player: {x: 0, y: 0},
                onCell: ' ',
        };
        if (Level) {
            this.establishEnvironment(Environment, Level);
            startIndex = Environment.cellLocations['$'][0];
            Environment.cells[startIndex] = ' ';
            this.Player.x = startIndex[0];
            this.Player.y = startIndex[1];
        }
        return Environment;
    },
    movePlayer: function(moveTo) {
        let Environment = this.Environment;
        if (!([moveTo.x, moveTo.y] in Environment.cells))
            return;  // Prevents walking off of playing zone.
        let fromRowDiv = document.getElementById(`row${this.Player.x}`);
        let fromImgEl = fromRowDiv.getElementsByTagName("img")[this.Player.y];
        fromRowDiv.replaceChild(
            this.Tiles[Environment.onCell].cloneNode(), fromImgEl);
        let toRowDiv = document.getElementById(`row${moveTo.x}`);
        let toImgEl = toRowDiv.getElementsByTagName("img")[moveTo.y];
        toRowDiv.replaceChild(GAME.Tiles['$'].cloneNode(), toImgEl);
        Environment.onCell = Environment.cells[[moveTo.x, moveTo.y]];
        this.Player.x = moveTo.x;
        this.Player.y = moveTo.y;
    },
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
        GAME.Levels = parseLevelFile(levelFile);
        GAME.Environment = GAME.nextEnvironment();
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
function init() {
    GAME.populateTiles();
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = GAME.keyInput.handle.bind(GAME);
    document.addEventListener("keydown", handleKey, false);
}
