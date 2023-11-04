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

let searchBox = ""


function preload() {
    font = loadFont('data/meiryo.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
}


function setup() {
    let cnv = createCanvas(500, 1500)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    debugCorner = new CanvasDebugCorner(5)
}


function draw() {
    background(0, 0, 0)

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

    if ([
        "a", "b", "c", "d", "e",
        "f", "g", "h", "i", "j",
        "k", "l", "m", "n", "o",
        "p", "q", "r", "s", "t",
        "u", "v", "w", "x", "y",
        "z", "A", "B", "C", "D",
        "E", "F", "G", "H", "I",
        "J", "K", "L", "M", "N",
        "O", "P", "Q", "R", "S",
        "T", "U", "V", "W", "X",
        "Y", "Z", "0", "1", "2",
        "3", "4", "5", "6", "7",
        "8", "9", " ", "[", "{",
        "]", "}", "|", "'", ":",
        ";", ",", ".", "/", "?",
        "<", ">", "\\"
    ].includes(key)) {
        searchBox += key
    } if (key === "Backspace") {
        if (keyIsDown(CONTROL)) {
            if (searchBox.includes(" ")) {
                while (searchBox[searchBox.length - 1] !== " ") {
                    searchBox = searchBox.substring(0, searchBox.length - 1)
                } while (searchBox[searchBox.length - 1] === " ") {
                    searchBox = searchBox.substring(0, searchBox.length - 1)
                }
            } else {
                searchBox = ""
            }
        } else {
            searchBox = searchBox.substring(0, searchBox.length - 1)
        }
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
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