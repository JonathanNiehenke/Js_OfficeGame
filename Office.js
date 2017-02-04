let db = console.log;

function OfficeGame() {
    // Tile actions requires the Engine prototype. By manually
    // assigning them later we avoid the chicken and the egg paradox.
    this.__proto__ = new Engine();
    this.parseLevelFile = function*(levelFile) {
        let fileLines = levelFile.target.result.split("\n");
        let Messages = [], Structure = [];
        for (let Line of fileLines) {
            let Begin = Line ? Line[0] : "";
            if (!Begin && Structure.length) {
                yield [Messages, Structure];
                // Previous references are gone.
                Messages = [];
                Structure = [];
            }
            else if (Begin === "\"") {
                Messages.push(Line);
            }
            else if (Begin === "\\" || !Begin) {
                continue;
            }
            else {
                Structure.push(Line);
            }
        }
    };
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
            document.getElementById("Game").className = "";
            document.getElementById("officeLevels").className = "Hidden";
        }
    };
    this.openCell = function(moveTo) {
        this.Environment.cell[moveTo] = " ";
        this.movePlayer(moveTo);
    };
// ? Why not use Tile.image
    this.replaceKeyImage = function(keyValue, cellValue) {
        let keyId = `Key_${keyValue}`;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById(keyId);
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = keyId;  // Reset the id for later use.
    };
    this.pickupKey = function(moveTo) {
        let cellTo = this.Environment.cell[moveTo];
        if (!this.Inventory.key[cellTo]) {
            this.Inventory.key[cellTo] = 1;
            this.openCell(moveTo);
            this.replaceKeyImage(cellTo, cellTo);
        }
    };
    this.openKeyLock = function(moveTo, cellTo) {
        let requiredKey = cellTo.toLowerCase();
        if (this.Inventory.key[requiredKey]) {
            this.Inventory.key[requiredKey] = 0;
            this.openCell(moveTo);
            this.replaceKeyImage(requiredKey, " ");
        }
    };
    this.changeRequirements = function(value) {
        this.Environment.requirements += value;
        let endIndex = this.Environment.end;
        let changeTo = this.Environment.requirements ? " " : "E";
        this.Environment.cell[endIndex] = changeTo;
        this.replaceImage(endIndex, changeTo);
    };
    this.__replaceObject = function(cellValue) {
        this.Inventory.object = cellValue;
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById("Object");
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = "Object";  // Reset the id for later use.
        if (cellValue === "@") {
            this.changeRequirements(-1);
            this.replaceAllCells(":", ":");
        }
        else {
            this.changeRequirements(1);
            this.replaceAllCells(":", ";");
        }
    };
    this.pickupObject = function(moveTo, cellTo) {
        if (this.Inventory.object === "@") {
            this.__replaceObject(cellTo);
            this.openCell(moveTo);
        }
    };
    this.dropObject = function(moveTo, cellTo) {
        let object = cellTo.toLowerCase();
        if (object === this.Inventory.object) {
            this.__replaceObject("@");
        }
    };
    this.swapPlug = function(moveTo, cellTo) {
        if (cellTo === this.Inventory.object) {
            this.__replaceObject("@");
        }
        else if ("@" === this.Inventory.object) {
            this.__replaceObject(cellTo);
        }
    };
    this.__replaceMap = function(moveTo, cellTo) {
        this.Inventory.map[moveTo] = cellTo;
        this.replaceImage(moveTo, cellTo);
    };
    this.swapObjects = function(moveTo, cellTo) {
        let fromHand = this.Inventory.object;
        if ("qr".indexOf(fromHand) === -1) {
            let fromDrop = this.Inventory.map[moveTo] || "@";
            this.__replaceObject(fromDrop);
            this.__replaceMap(moveTo, fromHand);
            if ((fromHand === "@") === (fromDrop === "@")) {
                this.changeRequirements(fromHand === "@" ? 1 : -1);
            }
        }
    };
    this.__constructInventory = function() {
        Inventory = {
            "key": {"a": 0, "b": 0, "c": 0, "d": 0},
            "map": {},
            "object": "@",
        };
        return Inventory;
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        Tile = {
            "$": {"image": getImg("Player"), "action": undefined},
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "#": {"image": getImg("Wall"), "action": undefined},
            ":": {"image": getImg("OpenNarrow"), "action": this.movePlayer},
            ";": {"image": getImg("ClosedNarrow"), "action": undefined},
            "@": {"image": getImg("DropZone"), "action": this.swapObjects},
            "a": {"image": getImg("RedKey"), "action": this.pickupKey},
            "b": {"image": getImg("BlueKey"), "action": this.pickupKey},
            "c": {"image": getImg("GreenKey"), "action": this.pickupKey},
            "d": {"image": getImg("YellowKey"), "action": this.pickupKey},
            "A": {"image": getImg("RedLock"), "action": this.openKeyLock},
            "B": {"image": getImg("BlueLock"), "action": this.openKeyLock},
            "C": {"image": getImg("GreenLock"), "action": this.openKeyLock},
            "D": {"image": getImg("YellowLock"), "action": this.openKeyLock},
            "e": {
                "image": getImg("Source"),
                "action": function(moveTo) {
                    this.Environment.cell[moveTo] = " ";
                    this.movePlayer(moveTo);
                    this.changeRequirements(-1);
                }
            },
            "E": {
                "image": getImg("Elevator"),
                "action": function(moveTo) {
                    this.Environment = this.nextEnvironment();
                    this.Inventory.map = {};
                }
            },
            "f": {"image": getImg("LockNumber"), "action": undefined},
            "F": {"image": getImg("PinLock"), "action": this.movePlayer},
            "g": {"image": getImg("Cart"), "action": this.pickupObject},
            "G": {"image": getImg("Plant"), "action": this.pickupObject},
            "h": {"image": getImg("Papers"), "action": this.pickupObject},
            "H": {"image": getImg("Desk"), "action": this.dropObject},
            "i": {"image": getImg("Trash"), "action": this.pickupObject},
            "I": {"image": getImg("TrashCan"), "action": this.dropObject},
            "j": {
                "image": getImg("Mop"),
                "action": function(moveTo, cellTo) {
                    this.Inventory.map[moveTo] = (
                    this.Inventory.map[moveTo] || "j");
                    this.swapObjects(moveTo, cellTo);
                }
            },
            "J": {
                "image": getImg("WetFloor"),
                "action": function(moveTo, cellTo) {
                    if (this.Inventory.object === "j") {
                        this.openCell(moveTo);
                    }
                }
            },
            "k": {
                "image": getImg("Flashlight"),
                "action": function(moveTo, cellTo) {
                    this.Inventory.map[moveTo] = (
                    this.Inventory.map[moveTo] || "k");
                    this.swapObjects(moveTo, cellTo);
                },
            },
            "K": {
                "image": getImg("Darkness"),
                "action": function(moveTo, cellTo) {
                    if (this.Inventory.object === "k") {
                        this.movePlayer(moveTo);
                    }
                }
            },
            "l": {
                "image": getImg("LightOff"),
                "action": function(moveTo, cellTo) {
                    this.replaceCell(moveTo, "L");
                    this.replaceAllCells("K", " ");
                    this.changeRequirements(1);
                }
            },
            "L": {
                "image": getImg("LightOn"),
                "action": function(moveTo, cellTo) {
                    this.replaceCell(moveTo, "l");
                    this.replaceAllCells("K", "K");
                    this.changeRequirements(-1);
                }
            },
            "m": {
                "image": getImg("MotionOn"),
                "action": function(moveTo, cellTo) {
                    this.replaceCell(moveTo, "M");
                    this.replaceAllCells("N", " ");
                    this.changeRequirements(1);
                }
            },
            "M": {
                "image": getImg("MotionOff"),
                "action": function(moveTo, cellTo) {
                    this.replaceCell(moveTo, "m");
                    this.replaceAllCells("N", "N");
                    this.changeRequirements(-1);
                }
            },
            "n": {"image": getImg("MotionNumber"), "action": undefined},
            "N": {"image": getImg("Signal"), "action": undefined},
            "q": {"image": getImg("LightPlug"), "action": this.swapPlug},
            "Q": {"image": getImg("Empty"), "action": undefined},
            "r": {"image": getImg("ComputerPlug"), "action": this.swapPlug},
            "R": {
                "image": getImg("Computer"),
                "action": function(moveTo) {
                    for (Index of this.Environment.cellLocations["p"]) {
                        this.replaceCell(Index, "P");
                    }
                }
            },
            "s": {
                "image": getImg("Socket"),
                "action": function(moveTo) {
                    Plug = this.Inventory.object
                    if ("qr".indexOf(Plug) !== -1) {
                        this.__replaceMap(moveTo, Plug);
                        this.__replaceObject("@");
                        this.replaceCell(moveTo, "S");
                        Powers = {"q": "l", "r": "R"}[Plug];
                        this.replaceAllCells(Plug, Powers);
                    }
                }
            },
            "S": {
                "image": getImg("PluggedSocket"),
                "action": function(moveTo) {
                    Plug = this.Inventory.map[moveTo];
                    Powers = {"q": "l", "r": "R"}[Plug];
                    function isOff(cellIndex) {
                        return this.Environment.cell[cellIndex] === Powers;
                    }
                    allUnpowered = this.Environment.cellLocations[Plug].every(
                        isOff.bind(this));
                    if (allUnpowered && this.Inventory.object === "@") {
                        this.__replaceObject(Plug);
                        this.__replaceMap(moveTo, "@");
                        this.replaceCell(moveTo, "s");
                        this.replaceAllCells(Plug, Plug);
                    }
                }
            },
            "p": {"image": getImg("PrinterX"), "action": undefined},
            "P": {
                "image": getImg("Printer"),
                "action": function(moveTo) {
                    this.replaceCell(moveTo, "#");
                    this.changeRequirements(-1);
                }
            },
            "0": {"image": getImg("DD0"), "action": undefined},
            "1": {"image": getImg("DD1"), "action": undefined},
            "2": {"image": getImg("DD2"), "action": undefined},
            "3": {"image": getImg("DD3"), "action": undefined},
            "4": {"image": getImg("DD4"), "action": undefined},
            "5": {"image": getImg("DD5"), "action": undefined},
            "6": {"image": getImg("DD6"), "action": undefined},
            "7": {"image": getImg("DD7"), "action": undefined},
            "8": {"image": getImg("DD8"), "action": undefined},
            "9": {"image": getImg("DD9"), "action": undefined},
        };
        return Tile;
    };
    this.Tile = this.__constructTiles();
    this.Inventory = this.__constructInventory();
}

function init() {
    let officeGame = new OfficeGame();
    let handleFileEvent = officeGame.handleFileEvent.bind(officeGame);
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = officeGame.keyInput.handle.bind(officeGame);
    document.addEventListener("keydown", handleKey, false);
}
