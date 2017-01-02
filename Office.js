let db = console.log;
let GAME = {
    Tiles: {},
    Levels: undefined,  // Will hold function generator after init();
    Environment: {},
    keyInput: {
        // 27 : "escape",
        37 : [0, -1], // Left Arrow
        38 : [-1, 0], // Up Arrow
        39 : [0, 1],  // Right Arrow
        40 : [1, 0],  // Left Arrow
        handle: function(keyEvent) {
            // Because method is called from document.addListener
            // this=document, so Key reference is used.
            let Movement = this[keyEvent.keyCode];
            if (Movement) {
                console.log(Movement);
            }
        }
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
        let [Messages, Structure] = Level,
            colLength = Structure.length;
        for (let x = 0; x < colLength; ++x) {
            let rowDiv = document.createElement("div"),
                Row = Structure[x],
                rowLength = Row.length;
            for (let y = 0; y < rowLength; ++y) {
                let Cell = {index: [x, y], value: Row[y]};
                Environment.cells[Cell.index] = Cell.value;
                pushKey(Environment.cellLocations, Cell.value, Cell.index);
                let Tile = GAME.Tiles[Cell.value].cloneNode();
                rowDiv.appendChild(Tile);
            }
            structureEl.appendChild(rowDiv);
        }
    },
    nextEnvironment: function() {
        let Level = GAME.Levels.next().value;
        let Environment = {
                cells: {},
                cellLocations: {},
                playerX: 0,
                playerY: 0,
        };
        if (Level) {
            this.establishEnvironment(Environment, Level);
            startIndex = Environment.cellLocations['$'][0];
            Environment.cells[startIndex] = GAME.Tiles[' '];
            Environment.playerX = startIndex[0];
            Environment.playerY = startIndex[1];
        }
        this.Environment = Environment;
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
    let handleKey = GAME.keyInput.handle.bind(GAME.keyInput);
    document.addEventListener("keydown", handleKey, false);
}
