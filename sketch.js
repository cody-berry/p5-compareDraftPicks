/**
 *  @author 
 *  @date 2023.
 *
 */


let font
let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let data
let cardNames
let searchBox = ""
let option

let cardsSelected = []
let addSelectedOptionToCards = false
let heightNeeded = 0

let displayState = "SEARCH"

function preload() {
    font = loadFont('data/meiryo.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
    data = loadJSON("json/master.json")
}


function setup() {
    let cnv = createCanvas(500, 800)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)
    cardNames = Object.keys(data)
}


function draw() {
    print(displayState)
    if (displayState === "SEARCH") {
        resizeCanvas(500, heightNeeded)
        background(0, 0, 10)

        textSize(50)
        fill(0, 0, 100)
        stroke(0, 0, 100)
        strokeWeight(3)
        textAlign(LEFT, TOP)
        text("SEARCH", 0, 0)

        // text box
        rectMode(CORNER)
        textSize(15)
        noFill()
        stroke(0, 0, 50)
        strokeWeight(1)
        rect(5, 100, 490, 30)
        stroke(0, 0, 100)
        strokeWeight(1)
        if (frameCount % 60 <= 30) {
            line(textWidth(searchBox) + 12, 105, textWidth(searchBox) + 12, 125)
        }

        // text in text box
        noStroke()
        fill(0, 0, 100)
        textAlign(LEFT, CENTER)
        text(searchBox, 10, 115)

        // get matches
        fill(0, 0, 50)
        let matchedNames = []
        let yPos = 150
        if (searchBox) {
            // first matches are ones where the first match is at the beginning
            let i = 0
            while (i < 20) {
                for (let cardName of cardNames) {
                    // make sure there's no repeats!
                    if (!matchedNames.includes(cardName) && cardName.toLowerCase().substring(i, i + searchBox.length) === searchBox.toLowerCase()) {
                        // limit is 9
                        if (matchedNames.length < 9) {
                            matchedNames.push(cardName)
                        }
                    }
                }
                i += 1
            }
        }

        let i = 0
        for (let cardName of matchedNames) {
            i += 1

            // display the alternating table color
            fill(0, 0, 20 + 10 * (i % 2))

            // if it is part of the cards list, make it green
            if (cardsSelected.includes(cardName)) {
                fill(120, 50, 50)
            }

            // if it is the selected option, make it orange
            // "+ matchedNames.length*10000" ensures that negative options
            // don't prompt no card display
            if (i - 1 === (option + matchedNames.length * 10000) % matchedNames.length) {
                fill(30, 100, 50)
                if (cardsSelected.includes(cardName)) {
                    fill(52, 87, 50)
                }
            }

            rect(0, yPos - 15, width, 30)

            // display the card name
            fill(0, 0, 100)
            text(cardName, 10, yPos - 3)

            // bold the first match. not all of them
            stroke(0, 0, 100)
            strokeWeight(1)
            text(cardName.substring(cardName.toLowerCase().indexOf(searchBox.toLowerCase()),
                cardName.toLowerCase().indexOf(searchBox.toLowerCase()) + searchBox.length),
                10 + textWidth(cardName.substring(0, cardName.toLowerCase().indexOf(searchBox.toLowerCase()))), yPos - 3)
            noStroke()
            yPos += 30
        }
        // if there are no matches, say it
        if (i === 0 && searchBox) {
            text("No matches found", 10, 150)
        }

        // if there are matches and addSelectedOptionToCards is true...
        if (matchedNames.length && addSelectedOptionToCards) {
            // add the selected option to the card list
            let cardName = matchedNames[(option + matchedNames.length * 10000) % matchedNames.length]
            if (cardsSelected.indexOf(cardName) !== -1) {
                cardsSelected.splice(cardsSelected.indexOf(cardName), 1)
            } else {
                cardsSelected.push(cardName)
            }

            print(cardsSelected)
        }

        // make sure that the option isn't added to the list the next time
        addSelectedOptionToCards = false

        // display the card list header
        fill(0, 0, 100)
        textSize(40)
        stroke(0, 0, 100)
        strokeWeight(2)
        textAlign(LEFT, BOTTOM)
        text("CARD LIST", 0, 470)

        // display all cards selected
        i = 0
        yPos = 500
        noStroke()
        textSize(15)
        textAlign(LEFT, CENTER)
        for (let cardName of cardsSelected) {
            i += 1

            // display the alternating table color
            fill(0, 0, 20 + 10 * (i % 2))
            rect(0, yPos - 15, width, 30)

            // display the card name
            fill(0, 0, 100)
            text(cardName, 10, yPos - 3)

            yPos += 30
        }
        heightNeeded = yPos - 15
    } if (displayState === "STATS") {
        resizeCanvas(800, heightNeeded)
        background(0, 0, 0)

        textSize(50)
        fill(0, 0, 100)
        stroke(0, 0, 100)
        strokeWeight(3)
        textAlign(LEFT, TOP)
        text("STATS", 0, 0)

        // display card list
        let i = 0
        let yPos = 100
        noStroke()
        textSize(15)
        textAlign(LEFT, CENTER)
        for (let cardName of cardsSelected) {
            i += 1

            // display the alternating table color
            fill(0, 0, 20 + 10 * (i % 2))
            rect(0, yPos - 15, width, 30)

            // display the card name
            fill(0, 0, 100)
            text(cardName, 10, yPos - 3)

            yPos += 30
        }
        heightNeeded = yPos + 50
    }

    // /* debugCorner needs to be last so its z-index is highest */
    // debugCorner.setText(`frameCount: ${frameCount}`, 2)
    // debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    // if (frameCount > 3000)
    //     noLoop()
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    let justEnteredSearch = false
    if (displayState === "STATS") {
        if ((keyCode === ENTER) && keyIsDown(CONTROL)) {
            displayState = "SEARCH"
            justEnteredSearch = true
            cardsSelected = []
        }
    }
    if (displayState === "SEARCH") {
        if ([
            'a', 'b', 'c', 'd', 'e',
            'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o',
            'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y',
            'z', 'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H', 'I',
            'J', 'K', 'L', 'M', 'N',
            'O', 'P', 'Q', 'R', 'S',
            'T', 'U', 'V', 'W', 'X',
            'Y', 'Z', '0', '1', '2',
            '3', '4', '5', '6', '7',
            '8', '9', ')', '!', '@',
            '#', '$', '%', '^', '&',
            '*', '(', ' ', '[', '{',
            ']', '}', '|', '"', ':',
            ';', '.', '/', '?', '>', '\'', '\\'
        ].includes(key)) {
            if (!keyIsDown(CONTROL) && !keyIsDown(ALT)) {
                searchBox += key
                option = 0
            }
        }
        if (key === "Backspace") {
            option = 0
            if (keyIsDown(CONTROL)) {
                if (searchBox.includes(" ")) {
                    while (searchBox[searchBox.length - 1] !== " ") {
                        searchBox = searchBox.substring(0, searchBox.length - 1)
                    }
                    while (searchBox[searchBox.length - 1] === " ") {
                        searchBox = searchBox.substring(0, searchBox.length - 1)
                    }
                } else {
                    searchBox = ""
                }
            } else {
                searchBox = searchBox.substring(0, searchBox.length - 1)
            }
        }
        if (keyCode === UP_ARROW) {
            option -= 1
        }
        if (keyCode === DOWN_ARROW) {
            option += 1
        }
        if (key === ",") {
            option = 0
            searchBox = ""
        }
        if (keyCode === ENTER) {
            if (keyIsDown(CONTROL)) {
                if (!justEnteredSearch) {
                    displayState = "STATS"
                    heightNeeded = 2738957398
                }
            }
            else {
                addSelectedOptionToCards = true
            }
        }
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }

    if (!keyIsDown(CONTROL) && !keyIsDown(ALT) && key !== "F12") {
        return false
    }
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.visible = true
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}