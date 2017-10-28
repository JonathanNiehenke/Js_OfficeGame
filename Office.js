let db = console.log;

function OfficeGame() {
    this.__proto__ = new Engine(undefined, "$", " ");
    this.end = undefined;
    this.requirements = 0;
    this.keyInput = {
        "38": new IndexObj(-1, 0), // Up Arrow
        "40": new IndexObj(1, 0),  // Down Arrow
        "37": new IndexObj(0, -1), // Left Arrow
        "39": new IndexObj(0, 1),  // Right Arrow
        "87": new IndexObj(-1, 0), // W Key (Up)
        "83": new IndexObj(1, 0),  // S Key (Down)
        "65": new IndexObj(0, -1), // A Key (Left)
        "68": new IndexObj(0, 1),  // D Key (Right)
        "73": new IndexObj(-1, 0), // I key (Up)
        "75": new IndexObj(1, 0),  // K Key (Down)
        "74": new IndexObj(0, -1), // J key (Left)
        "76": new IndexObj(0, 1),  // L key (Right)
        "handle": function(keyEvent) {
            let Movement = this.keyInput[keyEvent.keyCode]; if (Movement) {
                let moveTo = this.Environment.player.add(Movement);
                let cellTo = this.Environment.cell[moveTo.toString()];
                let cellAction = this.Tile[cellTo].action;
                if (cellAction) {
                    cellAction.call(this, moveTo, cellTo, Movement);
                }
            }
        },
    };
    this.parseLevelFile = function*(levelFile) {
        let titleEl = document.getElementById("levelTitle");
        let fileLines = levelFile.target.result.split("\n");
        let Structure = [], messageLine = 0;
        for (let Line of fileLines) {
            let Begin = Line ? Line[0] : "";
            if (!Begin && Structure.length) {
                yield Structure;
                // Previous references are gone.
                Structure = [];
            }
            else if (Begin === "\"") {  // Absorbing the other messages
                if (!messageLine) {
                    titleEl.innerHTML = Line;
                }
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
            this.requirements = (
                (this.Environment.cellLocations["e"] || []).length +
                (this.Environment.cellLocations["p"] || []).length +
                (this.Environment.cellLocations["P"] || []).length);
            endLocations = this.Environment.cellLocations["E"];
            this.end = endLocations ? endLocations[0] : startIndex;
            this.Inventory = new this.__constructInventory();
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
    this.resetKeys = function() {
        for (Key of "abcd") {
            this.replaceKeyImage(Key, " ");
            this.Inventory.key[Key] = 0;
        }
    };
    this.handleReset = function() {
        this.__replaceObject("@");
        this.resetKeys();
        this.Inventory.map = {};
        this.Environment = this.resetEnvironment();
        this.requirements = (
            (this.Environment.cellLocations["e"] || []).length +
            (this.Environment.cellLocations["p"] || []).length +
            (this.Environment.cellLocations["P"] || []).length
        );
    };
    this.movePlayer = function(moveTo, cellTo, Movement) {
        this.placePlayer(moveTo, "$")
    };
    this.openCell = function(moveTo) {
        this.Environment.cell[moveTo] = " ";
        this.movePlayer(moveTo);
    };
    this.replaceKeyImage = function(keyValue, cellValue) {
        let newImgEl = this.Tile[cellValue].image.cloneNode();
        let currentImgEl = document.getElementById(keyValue);
        currentImgEl.parentNode.replaceChild(newImgEl, currentImgEl);
        newImgEl.id = keyValue;  // Reset the id for later use.
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
        this.requirements += value;
        let changeTo = this.requirements ? " " : "E";
        this.Environment.cell[this.Environment.end] = changeTo;
        this.replaceImage(this.Environment.end, changeTo);
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
            this.openCell(moveTo);
            this.__replaceObject(cellTo);
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
        this.key = {"a": 0, "b": 0, "c": 0, "d": 0};
        this.object = "@";
        this.map = {};
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
                    this.requirements = (
                        (this.Environment.cellLocations["e"] || []).length +
                        (this.Environment.cellLocations["p"] || []).length +
                        (this.Environment.cellLocations["P"] || []).length);
                    endLocations = this.Environment.cellLocations["E"];
                    this.Inventory = new this.__constructInventory();
                    if (Object.keys(this.Environment.cell).length === 0) {
                        let levelTitle = document.getElementById("levelTitle");
                        levelTitle.innerHTML = "Game Complete!";
                        let structureEl = document.getElementById("Structure");
                        structureEl.className = "Hidden";
                        let inventoryEl = document.getElementById("Inventory");
                        inventoryEl.className = "Hidden";
                        let buttonEl = document.getElementById("resetButton");
                        buttonEl.className = "Hidden";
                    }
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
                        if (this.Environment.cell[Index] === "p") {
                            this.replaceCell(Index, "P");
                        }
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
}

function init() {
    let officeGame = new OfficeGame();
    let handleFileEvent = officeGame.handleFileEvent.bind(officeGame);
    document.getElementById("officeLevels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = officeGame.keyInput.handle.bind(officeGame);
    document.addEventListener("keydown", handleKey);
    document.getElementById("resetButton").addEventListener(
        "click", officeGame.handleReset.bind(officeGame), false);
}
