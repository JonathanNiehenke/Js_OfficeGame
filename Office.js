let db = console.log;

function OfficeGame() {
    // Tile actions requires the Engine prototype. By manually
    // assigning them later we avoid the chicken and the egg paradox.
    this.__proto__ = new Engine();
    this.parseLevelFile = function*(levelFile) {
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
    },
    this.handleFileEvent = function(fileEvent) {
        function onFileLoad(levelFile) {
            this.Levels = this.parseLevelFile(levelFile);
            this.Environment = this.nextEnvironment();
        }
        let levelFile = fileEvent.target.files[0];
        if (levelFile) {
            let Reader = new FileReader();
            Reader.onload = onFileLoad.bind(this);
            Reader.readAsText(levelFile);  // Calls Reader.onload.
            document.getElementById("Game").className = ""
            document.getElementById("officeLevels").className = "Hidden"
        }
    },
    this.openCell = function(moveTo) {
        this.Environment.cell[moveTo] = " ";
        this.movePlayer(moveTo);
    }
    this.replaceKeyImage = function(keyValue, cellValue) {
        let keyId = `Key_${keyValue}`;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById(keyId);
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = keyId;  // Reset the id for later use.
    };
    this.pickupKey = function(moveTo) {
        let cellToValue = this.Environment.cell[moveTo];
        if (!this.Inventory.key[cellToValue]) {
            this.Inventory.key[cellToValue] = 1;
            this.openCell(moveTo);
            this.replaceKeyImage(cellToValue, cellToValue);
        }
    },
    this.openKeyLock = function(moveTo, cellToValue) {
        let requiredKey = cellToValue.toLowerCase();
        if (this.Inventory.key[requiredKey]) {
            this.Inventory.key[requiredKey] = 0;
            this.openCell(moveTo);
            this.replaceKeyImage(requiredKey, " ");
        }
    },
    this.changeRequirements = function(value) {
        this.requirements += value;
        let changeTo = this.requirements ? " " : "E";
        let endIndex = this.Environment.end;
        this.Environment.cell[endIndex] = changeTo;
        this.replaceImage(endIndex, changeTo);
    },
    this.constructInventory = function() {
        Inventory = {
            key: {a: 0, b: 0, c: 0, d: 0},
            map: {},
            object: '@',
        }
        return Inventory;
    },
    this.constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        Tile = {
            "$": {image: getImg("Player"), action: undefined},
            " ": {image: getImg("Empty"), action: this.movePlayer},
            "#": {image: getImg("Wall"), action: undefined},
            ":": {image: getImg("OpenNarrow"), action: undefined},
            ";": {image: getImg("ClosedNarrow"), action: undefined},
            "@": {image: getImg("DropZone"), action: undefined},
            "a": {image: getImg("RedKey"), action: this.pickupKey},
            "b": {image: getImg("BlueKey"), action: this.pickupKey},
            "c": {image: getImg("GreenKey"), action: this.pickupKey},
            "d": {image: getImg("YellowKey"), action: this.pickupKey},
            "A": {image: getImg("RedLock"), action: this.openKeyLock},
            "B": {image: getImg("BlueLock"), action: this.openKeyLock},
            "C": {image: getImg("GreenLock"), action: this.openKeyLock},
            "D": {image: getImg("YellowLock"), action: this.openKeyLock},
            "e": {image: getImg("Source"),
                  action: function(moveTo) {
                    this.Environment.cell[moveTo] = " ";
                    this.movePlayer(moveTo);
                    this.changeRequirements(-1);
                  }
            },
            "E": {image: getImg("Elevator"),
                  action: function(moveTo) {
                        this.Environment = this.nextEnvironment();
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
                            this.replaceCell(Index, "P");
                        }
                  }
            },
            "R": {image: getImg("ComputerPlug"), action: undefined},
            "s": {image: getImg("Socket"), action: undefined},
            "S": {image: getImg("PluggedSocket"), action: undefined},
            "p": {image: getImg("PrinterX"), action: undefined},
            "P": {image: getImg("Printer"),
                  action: function(moveTo) {
                    this.replaceCell(moveTo, "#");
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
    };
    this.Tile = this.constructTiles();
    this.Inventory = this.constructInventory();
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
    let officeGame = new OfficeGame();
    let handleFileEvent = officeGame.handleFileEvent.bind(officeGame);
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = officeGame.keyInput.handle.bind(officeGame);
    document.addEventListener("keydown", handleKey, false);
}
