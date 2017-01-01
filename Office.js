let db = console.log;
let Tiles = {};
function handleFileEvent(fileEvent) {
    let levelFile = fileEvent.target.files[0];
    let Reader = new FileReader();
    if (levelFile) {
        Reader.onload = startGame;
        Reader.readAsText(levelFile);
    }
}
function populateTiles() {
    let tileTypes = "$ #:;@abcdABCDeEfFgGhHiIjJkKlLmMnNqQrRsSpP0123456789";
    let imageDiv = document.getElementById("tileImages");
    let tileImages = imageDiv.getElementsByTagName("img");
    let tileLength = tileImages.length;
    for (let i = 0; i < tileLength; ++i) {
        Tiles[tileTypes[i]] = tileImages[i];
    }
}
function displayLevel(Messages, Structure) {
    let levelTitle = document.getElementById("levelTitle");
    levelTitle.innerHTML = Messages[0];
    let structureEl = document.getElementById("Structure");
    structureEl.innerHTML = "";
    for (Row of Structure) {
        for(Cell of Row) {
            let Tile = Tiles[Cell].cloneNode();
            structureEl.appendChild(Tile);
        }
        structureEl.appendChild(document.createElement("br"));
    }
}
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
function startGame(levelFile) {
    let gameLevels = parseLevelFile(levelFile);
    let Level = gameLevels.next().value;
    if (Level.length)
        displayLevel(...Level);
}
function init() {
    populateTiles();
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
}
