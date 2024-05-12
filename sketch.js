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
let dataAll
let dataTop
let winrateStatistics
let winrateStatisticsAll
let winrateStatisticsTop
let cardNames

let searchBox = ""
let option
let cardsSelected = []
let cardsDisplayedLastFrame = []
let addSelectedOptionToCards = false
let cardsExpanded = false
let numMatches = 0

let heightNeeded = 0
let gradeColors

let images = {}
let WUBRG
let SVGsOn = {}
let colorsSelected = 0
let colorPair = "all"
let calibre = "ALL"
let sortingMethod = "MIX"
let cardsSaved = false

let displayState = "SEARCH"



function preload() {
    font = loadFont('data/meiryo.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
    dataAll = loadJSON("json/master.json")
    dataTop = loadJSON("json/masterTop.json")
    winrateStatisticsAll = loadJSON("json/statistics.json")
    winrateStatisticsTop = loadJSON("json/statisticsTop.json")
    WUBRG = {
        "W": loadImage("WUBRG/W.png"),
        "U": loadImage("WUBRG/U.png"),
        "B": loadImage("WUBRG/B.png"),
        "R": loadImage("WUBRG/R.png"),
        "G": loadImage("WUBRG/G.png")
    }
    WUBRGSVGs = {
        "W": loadImage("svg/W.svg"),
        "U": loadImage("svg/U.svg"),
        "B": loadImage("svg/B.svg"),
        "R": loadImage("svg/R.svg"),
        "G": loadImage("svg/G.svg")
    }
    SVGsOn = { // each key is a color. each value is [SVG on?, color, xPos]
        "W": [false, [60, 15, 100], 200],
        "U": [false, [190, 50, 85], 240],
        "B": [false, [300, 5, 50], 280],
        "R": [false, [0, 65, 90], 320],
        "G": [false, [90, 100, 60], 360]
    }
}

// calculates the grade
function calculateGrade(zScore) {
    let result

    // special: S
    if (zScore > 3.25)
        result = "S"
    // A range (1.5 <= zScore < 3.25)
    else if (zScore > 2.5)
        result = "A+"
    else if (zScore > 2)
        result = "A"
    else if (zScore > 1.5)
        result = "A-"
    // B range (0.5 <= zScore < 1.5)
    else if (zScore > (1.5 - 1 / 3))
        result = "B+"
    else if (zScore > (0.5 + 1 / 3))
        result = "B"
    else if (zScore > 0.5)
        result = "B-"
    // C range (-0.5 <= zScore < 0.5)
    else if (zScore > (0.5 - 1 / 3))
        result = "C+"
    else if (zScore > (-0.5 + 1 / 3))
        result = "C"
    else if (zScore > -0.5)
        result = "C-"
    // D range (-1.5 <= zScore < -0.5)
    else if (zScore > (-0.5 - 1 / 3))
        result = "D+"
    else if (zScore > (-1.5 + 1 / 3))
        result = "D"
    else if (zScore > -1.5)
        result = "D-"
    // E range (-2 <= zScore < -1.5)
    else if (zScore > -2)
        result = "E"
    // F range
    else
        result = "F"

    return result
}

function setup() {
    let cnv = createCanvas(500, 800)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)
    print(images)

    data = dataAll
    winrateStatistics = winrateStatisticsAll

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch
        search screen: 
            this is the initial screen. 
            input partial card names into the mini textbox. 
            use DOWN ARROW and UP ARROW to move between cards.
            click on the button with the down arrow to expand to all cards. 
            press ENTER to toggle the selection of the card marked orange.
            press CTRL+ENTER to:
                move to the single-card popup screen if 1 card is selected. 
                move to the no-card popup screen if 0 cards are selected. 
                move to the multi-card popup screen if 2 cards are selected.
        no-card popup screen: 
            does not show anything.
            press CTRL+ENTER to go back to SEARCH screen.
        single-card popup screen:
            the left column is for the color pair
            the middle column is for opening-hand winrate. 
            the right column is for game-drawn winrate. 
            each column has 3 parts:
                the grade part, displaying a grey rect with a grade on it.
                the sample part, which is what the 10K and 5 ticks are for. 
                    a bar will be displayed here in each row.
                    this bar corresponds to how many samples according to ticks.
                the winrate part, which is what the percentage ticks are for. 
                    the grey dot is the mean. 
                    the white dot is the actual winrate. 
                    the dark grey line connects the dot. 
                    the ticks correspond to the z-score. 
                        the ticks correspond to 1, 2, 3, etc. z-score. 
            each row corresponds to a color pair, with the first being all. 
            the ALSA will be displayed on the top-left.
            toggle between TOP and ALL data just below the ALSA.
            press CTRL+ENTER to go back to SEARCH screen.
        multi-card popup screen:
            columns are much like single-card popup screen.
                except with an additional one for ALSA between left and middle.
                and a replacaement for the left one as the name.
            each row corresponds to a color. 
            use DOWN ARROW and UP ARROW to move between cards.
            press ENTER to move to the single-card popup screen.
                the card in that popup is the card selected. 
            toggle between TOP and ALL data at the top. 
            press the colors to toggle them on or off. 
                on deselecting all of them, the stats goes to all color data.
                on selecting 2 of them, the stats goes to the colors selected.
                    note: these are color pairs, not colors on their own.
                selecting 3 is not allowed.
            press the GD/OH/GD+OH button to toggle the sort.
                GD: sort by GD winrate.
                    click on GD or OH to switch to OH.
                    click on GD+OH to switch to GD+OH.
                OH: sort by OH winrate.
                    click on GD or OH to switch to GD.
                    click on GD+OH to switch to GD+OH.
                GD+OH: average out the two. this provides something like GIH.
                    click on GD or OH to switch to GD.
                cards without enough data will be counted as low Fs.
                cards will be sorted from how they were sorted before.
            press the SAVE button once to keep card selection after exitting.
                if you go to single-card popup screen, only that card is saved.
            press CTRL+ENTER to go back to SEARCH screen.
        </pre>`)

    debugCorner = new CanvasDebugCorner(5)
    cardNames = Object.keys(data)
    gradeColors = {
        "S": [140, 100, 77],
        "A+": [137, 82, 77],
        "A": [129, 67, 78],
        "A-": [116, 56, 79],
        "B+": [101, 55, 80],
        "B": [87, 54, 81],
        "B-": [72, 53, 82],
        "C+": [57, 53, 85],
        "C": [46, 58, 97],
        "C-": [34, 61, 93],
        "D+": [22, 65, 90],
        "D": [10, 68, 87],
        "D-": [359, 74, 84],
        "E": [354, 83, 82],
        "F": [350, 92, 80]
    }
    print(cardNames)

}

function drawTextBox() {
    // text box outline
    rectMode(CORNER)
    textSize(15)
    noFill()
    stroke(0, 0, 50)
    strokeWeight(1)
    rect(5, 100, 490, 30)

    // cursor (displays for the first 30 frames of every 60 frames)
    stroke(0, 0, 100)
    strokeWeight(1)
    if (frameCount % 60 <= 30) {
        let cursorXPos = textWidth(searchBox) + 12
        let cursorYPos = 105
        let cursorHeight = 20
        line(cursorXPos, cursorYPos, cursorXPos, cursorYPos + cursorHeight)
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
                    matchedNames.push(cardName)
                }
            }
            i += 1
        }
    }

    let i = 0
    for (let cardName of matchedNames) {
        if (i < 9 || cardsExpanded === true) {
            i += 1

            // fill and display alternating table color
            fillAlternatingTableColor(i)

            // if it is part of the cards list, make it green
            if (cardsSelected.includes(cardName)) {
                fill(120, 50, 50)
            }

            // if it is the selected option, make it orange
            // "+ matchedNames.length*10000" ensures that negative options
            // don't prompt no card display
            if (i - 1 === (option + matchedNames.length * 10000) % matchedNames.length) {
                fill(30, 100, 50)

                // if it's the selected option and it's part of the card list, make it a slightly green-ish orange color
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

            // enable caseless matching by making both lowercase
            let lowerCaseCardName = cardName.toLowerCase()
            let lowerCaseSearchBox = searchBox.toLowerCase()

            // now, match the lowercase variables
            let firstOccurenceOfSearchBoxInCardName = lowerCaseCardName.indexOf(lowerCaseSearchBox)

            // convert the match back to its proper case
            let matchInCardName = cardName.substring(firstOccurenceOfSearchBoxInCardName, firstOccurenceOfSearchBoxInCardName + searchBox.length)

            // and display it now
            text(matchInCardName, 10 + textWidth(cardName.substring(0, firstOccurenceOfSearchBoxInCardName)), yPos - 3)
            noStroke()
            yPos += 30
        }
    }
    if (matchedNames.length > 9 && !cardsExpanded) {
        fill(0, 0, 50)
        text(`...and ${matchedNames.length - 9} more`, 10, yPos)

        // draw the expand button
        if (mouseX > width - 40 && mouseX < width - 10 &&
            mouseY > yPos - 10 && mouseY < yPos + 15) {
            fill(0, 0, 30)
        }
        rect(width - 40, yPos - 10, 30, 25)
        fill(0, 0, 100)
        triangle(width - 35, yPos - 5,
                 width - 15, yPos - 5,
                 width - 25, yPos + 10)
    }

    // if there are no matches, say it
    if (i === 0 && searchBox) {
        text("No matches found", 10, 150)
    }

    // if there are matches and we're supposed to add the selected option this frame...
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

    numMatches = matchedNames.length
}

// just fills a certain grey color according to the number of these drawn, i
function fillAlternatingTableColor(i) {
    fill(0, 0, 20 + 10 * (i % 2))
}

// draws the screen for no data
function noDataScreen() {
    resizeCanvas(200, 40)
    background(0, 0, 0)

    // say that there are no cards selected
    fill(0, 50, 100)
    stroke(0, 50, 100)
    strokeWeight(1)
    textAlign(LEFT, TOP)
    text("You didn't enter any cards.", 0, 0)
    fill(0, 0, 100)
    stroke(0, 0, 100)
    strokeWeight(0)
    text("Please press Ctrl+Enter.", 0, 20)
}

// finds the winrate ticks for minWinrate and maxWinrate, such that the
// lowest and highest ticks are 75-90% left and right to the boundaries of the ticks
function findWinrateTicks(minWinrate, maxWinrate) {
    // iterate through every tick needed for OH and GIH (increments of 5)
    let winrateTicks = []
    for (let i = minWinrate - (maxWinrate - minWinrate)/10; i < maxWinrate + (maxWinrate - minWinrate)/2; i += 5) {
        winrateTicks.push(Math.round(i))
    }
    return winrateTicks
}

function displayTicks(zeroTickOH, // 0K or 0M
                      oneTickOH, // the first tick for OH
                      twoTickOH, // the second tick for OH, oneTickOH*2
                      zeroTickGIH, // 0K or 0M
                      oneTickGIH, // the first tick for GIH
                      twoTickGIH, // the second tick for GIH, oneTickGIH*2
                      winrateTicksOH, // the winrate ticks in OH, from findWinrateTicks()
                      winrateTicksGIH, // the winrate ticks in GIH, from findWinrateTicks()
                      startOfGIH, // the starting x position of GIH
                      startOfOH, // the starting x position of OH
                      startingYPos, // the starting y position for everything
                      colorPairsWithEnoughData // the color pairs with enough data
) {
    // array for all the offsets, OH and GIH
    let offsetsForLines = [
        40, 90, 140
    ]
    let offsetsForTicks = [
        32, 82, 132
    ]

    // display the tick numbers
    fill(0, 0, 50)
    textSize(12)
    noStroke()
    textAlign(CENTER, TOP)

    // OH
    text(zeroTickOH, startOfOH + offsetsForTicks[0], startingYPos)
    text(oneTickOH, startOfOH + offsetsForTicks[1], startingYPos)
    text(twoTickOH, startOfOH + offsetsForTicks[2], startingYPos)

    // GIH
    text(zeroTickGIH, startOfGIH + offsetsForTicks[0], startingYPos)
    text(oneTickGIH, startOfGIH + offsetsForTicks[1], startingYPos)
    text(twoTickGIH, startOfGIH + offsetsForTicks[2], startingYPos)


    // display the lines under the ticks
    let startingYPosForLines = startingYPos + 20 // the starting yPos for the lines is just 20 above the starting yPos for the tick numbers
    let heightOfLines = 115 + startingYPos + colorPairsWithEnoughData.length*60
    stroke(0, 0, 50)
    strokeWeight(1)

    // now display the winrate ticks and lines
    // OH
    line(startOfOH + offsetsForLines[0], startingYPosForLines, startOfOH + offsetsForLines[0], heightOfLines)
    line(startOfOH + offsetsForLines[1], startingYPosForLines, startOfOH + offsetsForLines[1], heightOfLines)
    line(startOfOH + offsetsForLines[2], startingYPosForLines, startOfOH + offsetsForLines[2], heightOfLines)

    // GIH
    line(startOfGIH + offsetsForLines[0], startingYPosForLines, startOfGIH + offsetsForLines[0], heightOfLines)
    line(startOfGIH + offsetsForLines[1], startingYPosForLines, startOfGIH + offsetsForLines[1], heightOfLines)
    line(startOfGIH + offsetsForLines[2], startingYPosForLines, startOfGIH + offsetsForLines[2], heightOfLines)


    // OH
    let xPos = startOfOH + 190
    for (let winrateTick of winrateTicksOH) {
        noStroke()
        text(winrateTick + "%", xPos - 8, startingYPos) // tick
        stroke(0, 0, 50)
        line(xPos, startingYPos + 20, xPos, heightOfLines) // line
        xPos += 50
    }

    // GIH
    xPos = startOfGIH + 190
    for (let winrateTick of winrateTicksGIH) {
        noStroke()
        text(winrateTick + "%", xPos - 8, startingYPos) // tick
        stroke(0, 0, 50)
        line(xPos, startingYPos + 20, xPos, heightOfLines) // line
        xPos += 50
    }
}

// I couldn't find a good name for this one. But essentially, what it's doing is
// converting a number to 5K or 0.3M notation.
function simplifyNum(num) {
    // 100000 = 0.1M, which is the splitter for using 0.3M notation and using
    // 5K notation.
    // round(num/100)*100 rounds the number to the nearest hundredth. M means
    // dividing by 1,000,000 and K means dividing by 1,000.
    return (num > 100000) ? (round(num/100)*100/1000000 + "M") : (round(num/100)*100/1000 + "K");
}

// draws the standard deviation ticks for a winrate
function drawStDevTicks(winrateTicks, winrate,
                        winrateMean, overallStDev,
                        xPos, yPos) {
    // each winrate percentage is 10 xPos
    let winrateXPos = xPos + (winrate - winrateTicks[0])*10
    let winrateMeanXPos = xPos + (winrateMean - winrateTicks[0])*10
    let xDeltaPerStDev = overallStDev*10

    stroke(0, 0, 50)
    strokeWeight(3)
    for (xPos = min(winrateXPos, winrateMeanXPos) + xDeltaPerStDev;
         xPos < max(winrateXPos, winrateMeanXPos); xPos += xDeltaPerStDev) {
        line(xPos, yPos - 5, xPos, yPos + 5)
    }
}

function parseAsWinrate(winrate) {
    if (winrate) return winrate
    else return 0
}

function compareWinrates(cardNameA, cardNameB) {
    let winrateA
    let winrateB

    if (sortingMethod === "MIX") {
        let cardSelectedA = data[cardNameA]
        let colorPairDataA = cardSelectedA[colorPair]
        let winrateAOH = float(colorPairDataA["OH WR"].substring(0, colorPairDataA["OH WR"].length - 1))
        let winrateAGIH = float(colorPairDataA["GIH WR"].substring(0, colorPairDataA["GIH WR"].length - 1))
        winrateA = winrateAOH/2 + winrateAGIH/2
        let cardSelectedB = data[cardNameB]
        let colorPairDataB = cardSelectedB[colorPair]
        let winrateBOH = float(colorPairDataB["OH WR"].substring(0, colorPairDataB["OH WR"].length - 1))
        let winrateBGIH = float(colorPairDataB["GIH WR"].substring(0, colorPairDataB["GIH WR"].length - 1))
        winrateB = winrateBOH/2 + winrateBGIH/2
    } else {
        let cardSelectedA = data[cardNameA]
        let colorPairDataA = cardSelectedA[colorPair]
        winrateA = float(colorPairDataA[sortingMethod + " WR"].substring(0, colorPairDataA[sortingMethod + " WR"].length - 1))
        let cardSelectedB = data[cardNameB]
        let colorPairDataB = cardSelectedB[colorPair]
        winrateB = float(colorPairDataB[sortingMethod + " WR"].substring(0, colorPairDataB[sortingMethod + " WR"].length - 1))
    }
    return parseAsWinrate(winrateB) - parseAsWinrate(winrateA)
}

function draw() {
    if (displayState === "SEARCH") {
        resizeCanvas(500, heightNeeded)
        background(0, 0, 10)

        // display a big, bold SEARCH at the top
        textSize(50)
        fill(0, 0, 100)
        stroke(0, 0, 100)
        strokeWeight(3)
        textAlign(LEFT, TOP)
        text("SEARCH", 0, 0)

        // text box
        drawTextBox()

        // display a big, bold CARD LIST next (not as big or bold as last time)
        fill(0, 0, 100)
        textSize(40)
        stroke(0, 0, 100)
        strokeWeight(2)
        textAlign(LEFT, BOTTOM)
        text("CARD LIST", 0, (cardsExpanded) ? max(500, 200 + numMatches*30) : 500)

        // display all cards selected
        let i = 0
        let yPos = (cardsExpanded) ? max(530, 230 + numMatches*30) : 530
        let heightOfBlock = 30 // the height of each row
        noStroke()
        textSize(15)
        textAlign(LEFT, CENTER)
        for (let cardName of cardsSelected) {
            i += 1

            // display a rectangle representing the row with alternating table color
            fillAlternatingTableColor(i)
            rect(0, yPos - heightOfBlock/2, width, heightOfBlock)

            // display the card name
            fill(0, 0, 100)
            text(cardName, 10, yPos - 3)

            yPos += heightOfBlock
        }
        heightNeeded = yPos - heightOfBlock/2
    } if (displayState === "STATS") {
        // display headers
        // also find out ticks
        let startOfOH = 300 // the starting x-position of the OH section
        let startOfGIH = startOfOH + 210 // the starting x-position of the GIH section
        let widthNeeded = startOfGIH + 210 // the width needed. takes effect this frame
        let maxSamplesOH = 0 // the maximum samples of each card in OH
        let maxSamplesGIH = 0 // the maximum samples of each card in GIH
        let maxWinrateOH = 0 // the maximum OH winrate of the cards
        let minWinrateOH = 100 // the minimum OH winrate of the cards
        let maxWinrateGIH = 0 // the maximum GIH winrate of the cards
        let minWinrateGIH = 100 // the minimum GIH winrate of the cards
        let cardsWithEnoughOHData = [] // the cards with enough data such that it has OH winrate data
        let cardsWithEnoughGIHData = [] // the cards with enough data such that it has GIH winrate data
        for (let cardName of cardsSelected) {
            let cardStats = data[cardName][colorPair] // grab the data for all color pairs
            // update if needed
            maxSamplesOH = max(maxSamplesOH, cardStats["# OH"])
            maxSamplesGIH = max(maxSamplesGIH, cardStats["# GD"])

            if (cardStats["OH WR"] !== "") { // check for enough data
                minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                cardsWithEnoughOHData.push(cardName)
            } if (cardStats["GIH WR"] !== "") {
                minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                cardsWithEnoughGIHData.push(cardName)
            }



        }
        // round the mean winrate to the nearest tenth
        minWinrateOH = parseInt(min(minWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
        maxWinrateOH = parseInt(max(maxWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
        minWinrateGIH = parseInt(min(minWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))
        maxWinrateGIH = parseInt(max(maxWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))
        // make sure there are actually cards with enough data!
        if (cardsSelected.length === 0) {
            noDataScreen()
        } else if (cardsSelected.length === 1) {
            // special case: display color pairs
            // find out ticks for OH WR and GIH WR, which means finding the
            // maximum OH WR and GIH WR values
            let startingYPos = 180 // starting y pos is in the middle
            let startOfOH = 390 // the starting x-position of the OH section
            let startOfGIH = startOfOH + 210 // the starting x-position of the GIH section
            let widthNeeded = startOfGIH + 210 // the width needed. takes effect this frame
            let heightNeeded = 500 // the height needed. takes effect this frame
            let maxSamplesOH = 0 // the maximum samples of each card in OH
            let maxSamplesGIH = 0 // the maximum samples of each card in GIH
            let maxWinrateOH = 0 // the maximum OH winrate of the cards
            let minWinrateOH = 100 // the minimum OH winrate of the cards
            let maxWinrateGIH = 0 // the maximum GIH winrate of the cards
            let minWinrateGIH = 100 // the minimum GIH winrate of the cards
            let colorPairsWithEnoughData = []
            let allOHDataAvailable = false
            let allGIHDataAvailable = false
            for (let colorPair of [
                "WU", "WB", "WR", "WG",
                "UB", "UR", "UG",
                "BR", "BG", "RG"
            ]) {
                let cardStats = data[cardsSelected[0]][colorPair]
                if (cardStats["OH WR"] !== "") { // check for enough data
                    // update if needed
                    maxSamplesOH = max(maxSamplesOH, cardStats["# OH"])
                    maxSamplesGIH = max(maxSamplesGIH, cardStats["# GD"])

                    minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                    maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                    minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                    maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))

                    // this time, calculate mean (rounded to tenths) each color pair
                    minWinrateOH = min(minWinrateOH, round(winrateStatistics[colorPair]["OH WR"]["μ"]*10)/10)
                    maxWinrateOH = max(maxWinrateOH, round(winrateStatistics[colorPair]["OH WR"]["μ"]*10)/10)
                    minWinrateGIH = min(minWinrateGIH, round(winrateStatistics[colorPair]["GIH WR"]["μ"*10]/10))
                    maxWinrateGIH = max(maxWinrateGIH, round(winrateStatistics[colorPair]["GIH WR"]["μ"*10]/10))

                    colorPairsWithEnoughData.push(colorPair)

                    startingYPos -= 20
                }
            }
            if (startingYPos < 20) {
                // make the difference between 20 and startingYPos add to the height twice
                heightNeeded += 2*(20 - startingYPos)
                startingYPos = 20
            }
            let cardStats = data[cardsSelected[0]]["all"]
            if (cardStats["OH WR"] !== "") {
                minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                minWinrateOH = parseInt(min(minWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
                maxWinrateOH = parseInt(max(maxWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
            } if (cardStats["GIH WR"] !== "") {
                minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                minWinrateGIH = parseInt(min(minWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"] * 10) / 10))
                maxWinrateGIH = parseInt(max(maxWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"] * 10) / 10))
                allOHDataAvailable = true
                allGIHDataAvailable = true
            }

            // now for the ticks
            let ticksOH = findSampleTicks(maxSamplesOH)
            let ticksGIH = findSampleTicks(maxSamplesGIH)

            // process the sample ticks
            let zeroTickOH = ticksOH[0]
            let oneTickOH = ticksOH[1]
            let twoTickOH = ticksOH[2]
            let oneTickNumOH = ticksOH[3]
            let zeroTickGIH = ticksGIH[0]
            let oneTickGIH = ticksGIH[1]
            let twoTickGIH = ticksGIH[2]
            let oneTickNumGIH = ticksGIH[3]

            // find the winrate ticks
            let winrateTicksGIH = findWinrateTicks(minWinrateGIH, maxWinrateGIH)
            let winrateTicksOH = findWinrateTicks(minWinrateOH, maxWinrateOH)

            // make sure to update accordingly!
            // startOfGIH increases by 50 for each winrate tick in OH
            let xPositionBetweenWinrateTicks = 50

            startOfGIH += max(winrateTicksOH.length * xPositionBetweenWinrateTicks, 100)

            // widthNeeded increases by 50 for each winrate tick
            widthNeeded += max(winrateTicksGIH.length * xPositionBetweenWinrateTicks, 100) + max(winrateTicksOH.length * xPositionBetweenWinrateTicks, 100)

            // now actually display the screen
            resizeCanvas(widthNeeded, heightNeeded)
            if (frameCount % 120 < 10) {
                print(heightNeeded)
            } if (frameCount % 120 === 10) {
                print("-----")
            }
            background(0, 0, 0)

            // display a big STATS header
            textSize(50)
            fill(0, 0, 100)
            stroke(0, 0, 100)
            strokeWeight(3)
            textAlign(LEFT, TOP)
            text("STATS", 10, 0)

            // as well as ALSA
            noStroke()
            textSize(20)
            text(`ALSA ${parseFloat(data[cardsSelected[0]]["ALSA"]).toFixed(2)}`, 190, 10)

            // display calibre
            if (calibre === "TOP") {
                fill(120, 80, 60) // color for TOP
                rect(185, 38, 50, 22)
            } else {
                fill(60, 80, 60) // color for ALL
                rect(235, 38, 50, 22)
            }

            fill(0, 0, 100)
            text("TOP", 190, 35)
            text("ALL", 240, 35)
            noFill()
            stroke(0, 0, 25)
            rect(185, 38, 50, 22)
            rect(235, 38, 50, 22)

            // display the image for the card
            if (!images.hasOwnProperty(cardsSelected[0])) {
                images[cardsSelected[0]] = loadImage(`cardImages/otj/${cardsSelected[0]}.jpg`)
            }
            let imageToDisplay = images[cardsSelected[0]]
            let aspectRatio = [28, 39]
            let scale = 11
            image(imageToDisplay, 18, 60, aspectRatio[0]*scale, aspectRatio[1]*scale)

            // display the OH and GIH grades
            let gradeYPos = startingYPos + 30
            let gradeSquareSize = 30
            let gradeSquarePadding = 5
            let textCenterXPosOH = startOfOH + gradeSquareSize/2
            let textCenterXPosGIH = startOfGIH + gradeSquareSize/2
            let textCenterYPos = gradeYPos + 13
            // display a padded grey rectangle for OH
            // only if it has enough data though!
            if (allOHDataAvailable) {
                fill(0, 0, 50)
                noStroke()
                rect(startOfOH, gradeYPos, gradeSquareSize, gradeSquareSize, gradeSquarePadding)

                cardStats = data[cardsSelected[0]]["all"]
                // get the grade and display it at the center
                let grade = calculateGrade(cardStats["zScoreOH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(2)
                textSize(18)
                textAlign(CENTER, CENTER)
                text(grade, textCenterXPosOH, textCenterYPos)

                // display the winrate
                let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
                let meanOH = winrateStatistics["all"]["OH WR"]["μ"]

                // line between mean and winrate
                stroke(0, 0, 50)
                strokeWeight(3)
                line(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, startingYPos + 55,
                    startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, startingYPos + 55)

                // winrate
                stroke(0, 0, 100)
                strokeWeight(5)
                point(startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, startingYPos + 55)

                // mean
                stroke(0, 0, 75)
                strokeWeight(4)
                point(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, startingYPos + 55)

                drawStDevTicks(winrateTicksOH, winrateOH,
                    meanOH, winrateStatistics["all"]["OH WR"]["σ"],
                    startOfOH + 210, startingYPos + 55)
            } else {
                fill(0, 0, 100)
                textSize(15)
                noStroke()
                text("Not enough data", startOfGIH - 150, startingYPos + 55)
            }

            // do the same for GIH
            if (allGIHDataAvailable) {
                fill(0, 0, 50)
                noStroke()
                rect(startOfGIH, gradeYPos, gradeSquareSize, gradeSquareSize, gradeSquarePadding)


                let grade = calculateGrade(cardStats["zScoreGIH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(2)
                textSize(18)
                text(grade, textCenterXPosGIH, textCenterYPos)

                // display the winrate
                let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
                let meanGIH = winrateStatistics["all"]["GIH WR"]["μ"]

                // line between mean and winrate
                stroke(0, 0, 50)
                strokeWeight(3)
                line(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, startingYPos + 55,
                    startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, startingYPos + 55)

                // winrate
                stroke(0, 0, 100)
                strokeWeight(5)
                point(startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, startingYPos + 55)

                // mean
                stroke(0, 0, 75)
                strokeWeight(4)
                point(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, startingYPos + 55)

                drawStDevTicks(winrateTicksGIH, winrateGIH,
                    meanGIH, winrateStatistics["all"]["GIH WR"]["σ"],
                    startOfGIH + 210, startingYPos + 55)
            } else {
                text("Not enough data", widthNeeded - 150, startingYPos + 55)
            }

            // now display the ticks in this extra-long method
            displayTicks(
                zeroTickOH, oneTickOH, twoTickOH, // sample ticks for OH
                zeroTickGIH, oneTickGIH, twoTickGIH, // sample ticks for GIH
                winrateTicksOH, winrateTicksGIH, // winrate ticks
                startOfGIH, startOfOH, startingYPos, // X and Y positions
                colorPairsWithEnoughData // used to figure out how long the lines are
            )
            // as well as "OH" and "GD"
            noStroke()
            fill(0, 0, 100)
            text("OH", startOfOH + 9, startingYPos)
            text("GD", startOfGIH + 9, startingYPos)

            // display the samples (number)
            let samplesOH = cardStats["# OH"]
            let samplesGIH = cardStats["# GD"]

            noStroke()
            fill(0, 0, 100)
            textSize(20)
            textAlign(LEFT, CENTER)
            text(simplifyNum(samplesOH), startOfOH + 40, textCenterYPos)
            text(simplifyNum(samplesGIH), startOfGIH + 40, textCenterYPos)

            // repeat for all available color pairs
            let yPos = startingYPos + 85
            let i = true // switches on and off to tell whether there's an addition
            for (let colorPair of colorPairsWithEnoughData) {
                if (i) {
                    noStroke()
                    fill(0, 0, 100, 10)
                    rectMode(CORNER)
                    rect(280, yPos - 20, width, 40)
                }
                i = !i

                // display the color pair
                let calibreWidth = 55
                let padding = 2
                let xPos = startOfOH - calibreWidth*3/4 - padding
                for (let letter of colorPair) {
                    imageMode(CENTER)
                    image(WUBRG[letter], xPos, yPos, 30, 30)
                    imageMode(CORNER)

                    xPos += calibreWidth/2
                }

                // display the OH and GIH grades, same as last time
                let gradeYPos = yPos - 15
                let gradeSquareSize = 30
                let gradeSquarePadding = 3
                let textCenterXPosOH = startOfOH + gradeSquareSize/2
                let textCenterXPosGIH = startOfGIH + gradeSquareSize/2
                let textCenterYPos = gradeYPos + 13
                noStroke()
                fill(0, 0, 50)
                rect(startOfOH, gradeYPos, gradeSquareSize, gradeSquareSize, gradeSquarePadding)

                cardStats = data[cardsSelected[0]][colorPair]
                let grade = calculateGrade(cardStats["zScoreOH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(2)
                textSize(18)
                textAlign(CENTER, CENTER)
                text(grade, textCenterXPosOH, textCenterYPos)


                fill(0, 0, 50)
                noStroke()
                rect(startOfGIH, gradeYPos, gradeSquareSize, gradeSquareSize, gradeSquarePadding)


                grade = calculateGrade(cardStats["zScoreGIH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(2)
                textSize(18)
                text(grade, textCenterXPosGIH, textCenterYPos)


                // now display the samples with a bar with a rounded end
                let samplesOH = cardStats["# OH"]
                let samplesGIH = cardStats["# GD"]
                noStroke()
                fill(0, 0, 100)
                rect(startOfOH + 40, yPos - 4, (samplesOH/oneTickNumOH)*50, 8, 0, 4, 4, 0)
                rect(startOfGIH + 40, yPos - 4, (samplesGIH/oneTickNumGIH)*50, 8, 0, 4, 4, 0)

                // display the winrate, same as last time
                stroke(0, 0, 100)
                strokeWeight(5)
                let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
                let xPosWinrateOH = startOfOH + 190 + (winrateOH - winrateTicksOH[0])*10
                let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
                let xPosWinrateGIH = startOfGIH + 190 + (winrateGIH - winrateTicksGIH[0])*10
                let meanOH = winrateStatistics[colorPair]["OH WR"]["μ"]
                let xPosMeanOH = startOfOH + 190 + (meanOH - winrateTicksOH[0])*10
                let meanGIH = winrateStatistics[colorPair]["GIH WR"]["μ"]
                let xPosMeanGIH = startOfGIH + 190 + (meanGIH - winrateTicksGIH[0])*10
                stroke(0, 0, 50)
                strokeWeight(3)
                line(xPosMeanOH, yPos, xPosWinrateOH, yPos)
                line(xPosMeanGIH, yPos, xPosWinrateGIH, yPos)

                stroke(0, 0, 100)
                strokeWeight(5)
                point(xPosWinrateOH, yPos)
                point(xPosWinrateGIH, yPos)

                stroke(0, 0, 75)
                strokeWeight(4)
                point(xPosMeanOH, yPos)
                point(xPosMeanGIH, yPos)

                drawStDevTicks(
                    winrateTicksOH, winrateOH,
                    meanOH, winrateStatistics[colorPair]["OH WR"]["σ"],
                    startOfOH + 210, yPos)
                drawStDevTicks(
                    winrateTicksGIH, winrateGIH,
                    meanGIH, winrateStatistics[colorPair]["GIH WR"]["σ"],
                    startOfGIH + 210, yPos)

                yPos += 40
            }
        } else {
            let ticksOH = findSampleTicks(maxSamplesOH)
            let ticksGIH = findSampleTicks(maxSamplesGIH)

            // process the sample ticks
            let zeroTickOH = ticksOH[0]
            let oneTickOH = ticksOH[1]
            let twoTickOH = ticksOH[2]
            let oneTickNumOH = ticksOH[3]
            let zeroTickGIH = ticksGIH[0]
            let oneTickGIH = ticksGIH[1]
            let twoTickGIH = ticksGIH[2]
            let oneTickNumGIH = ticksGIH[3]

            // find the winrate ticks
            let winrateTicksGIH = findWinrateTicks(minWinrateGIH, maxWinrateGIH)
            let winrateTicksOH = findWinrateTicks(minWinrateOH, maxWinrateOH)

            // each tick is 50 x position
            startOfGIH += 50*winrateTicksOH.length
            widthNeeded += 50*winrateTicksOH.length + 50*winrateTicksGIH.length

            // now actually display the headers and ticks
            resizeCanvas(widthNeeded, heightNeeded)
            background(0, 0, 0)

            // display a big, bold STATS
            textSize(50)
            fill(0, 0, 100)
            stroke(0, 0, 100)
            strokeWeight(3)
            textAlign(LEFT, TOP)
            text("STATS", 10, 0)

            // and now display the actual headers: Name, ALSA, OH, and GIH
            fill(0, 0, 50)
            noStroke()
            textSize(12)
            let yPosHeaders = 65
            text("Name", 10, yPosHeaders)

            // display calibre
            if (calibre === "TOP") {
                fill(120, 80, 60) // color for TOP
                rect(400, 10, 50, 22)
            } else {
                fill(60, 80, 60) // color for ALL
                rect(450, 10, 50, 22)
            }

            textSize(20)
            fill(0, 0, 100)
            text("TOP", 405, 8)
            text("ALL", 455, 8)
            noFill()
            stroke(0, 0, 25)
            rect(400, 10, 50, 22)
            rect(450, 10, 50, 22)

            // display sorting method
            if (sortingMethod === "GIH") {
                fill(240, 80, 60) // color for GIH
                rect(510, 10, 40, 22)
            } else if (sortingMethod === "OH") {
                fill(300, 80, 60) // color for OH
                rect(550, 10, 40, 22)
            } else {
                fill(270, 80, 60) // color for mix
                rect(510, 32, 80, 16)
            }

            fill(0, 0, 100)
            text("GD", 515, 8)
            text("OH", 555, 8)
            textSize(15)
            text("GD+OH", 522, 30)
            noFill()
            stroke(0, 0, 25)
            rect(510, 10, 40, 22)
            rect(550, 10, 40, 22)
            rect(510, 32, 80, 16)

            fill(0, 0, 100)
            noStroke()
            textSize(10)
            text("ALSA", 240, yPosHeaders)

            fill(0, 0, 100)
            text("OH", startOfOH, yPosHeaders)
            text("GD", startOfGIH, yPosHeaders)

            displayTicks(
                zeroTickOH, oneTickOH, twoTickOH, // sample ticks for OH
                zeroTickGIH, oneTickGIH, twoTickGIH, // sample ticks for GIH
                winrateTicksOH, winrateTicksGIH, // winrate ticks
                startOfGIH, startOfOH, yPosHeaders, // X and Y positions (Y position is always 65)
                cardsSelected // used to figure out how long the lines are
            )

            noStroke()

            // display card list
            let i = 0
            let yPos = 100
            textSize(15)
            textAlign(LEFT, CENTER)
            let cardsDisplayedThisFrame = []
            let sortedCardsSelected = cardsSelected
            sortedCardsSelected.sort(compareWinrates)
            for (let cardName of sortedCardsSelected) {
                // is there enough data?
                let cardStats = data[cardName][colorPair]
                if (cardStats["# GD"] > 30) {
                    cardsDisplayedThisFrame.push(cardName)
                    i += 1

                    // display the alternating table color
                    fill(0, 0, 40 + 20 * (i % 2), 50)

                    // if it is the selected option, make it orange
                    // "+ matchedNames.length*10000" ensures that negative options
                    // don't prompt no card display
                    if (i - 1 === (option + cardsDisplayedLastFrame.length * 10000) % cardsDisplayedLastFrame.length) {
                        fill(30, 100, 90 + 10 * (i % 2), 50)
                    }

                    rect(0, yPos - 15, width, 30)

                    // display the card name
                    fill(0, 0, 100)
                    text(cardName, 10, yPos - 3)

                    // display the card ALSA, padded with 0s so that it always has 2 decimal points
                    text(parseFloat(data[cardName]["ALSA"]).toFixed(2), 240, yPos - 3)

                    // find out the grades and display them
                    // OH
                    let grade = calculateGrade(cardStats["zScoreOH"])
                    fill(gradeColors[grade][0],
                        gradeColors[grade][1],
                        gradeColors[grade][2])
                    stroke(gradeColors[grade][0],
                        gradeColors[grade][1],
                        gradeColors[grade][2])
                    strokeWeight(1)
                    if (cardsWithEnoughOHData.includes(cardName)) {
                        text(grade, startOfOH, yPos - 2)
                    }

                    // display the rectangle for the samples as well
                    let startingYPosOfSamples = yPos - 4
                    let heightOfSampleBar = 8
                    let xPosSamplesOH = (cardStats["# OH"] / oneTickNumOH) * 50
                    noStroke()
                    fill(0, 0, 100)
                    rect(startOfOH + 60, startingYPosOfSamples, xPosSamplesOH, heightOfSampleBar, 0, 4, 4, 0)

                    // GIH
                    grade = calculateGrade(cardStats["zScoreGIH"])
                    fill(gradeColors[grade][0],
                        gradeColors[grade][1],
                        gradeColors[grade][2])
                    stroke(gradeColors[grade][0],
                        gradeColors[grade][1],
                        gradeColors[grade][2])
                    strokeWeight(1)
                    if (cardsWithEnoughGIHData.includes(cardName)) {
                        text(grade, startOfGIH, yPos - 2)
                    }

                    // display the rectangle for the samples as well
                    // we don't have to re-define the context variables
                    let xPosSamplesGIH = (cardStats["# GD"] / oneTickNumGIH) * 50
                    noStroke()
                    fill(0, 0, 100)
                    rect(startOfGIH + 60, startingYPosOfSamples, xPosSamplesGIH, heightOfSampleBar, 0, 4, 4, 0)


                    textAlign(LEFT, CENTER)
                    // display the point for the winrate
                    if (cardsWithEnoughGIHData.includes(cardName)) {
                        let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
                        let xPosWinrateGIH = startOfGIH + 200 + (winrateGIH - winrateTicksGIH[0]) * 10
                        let meanGIH = winrateStatistics[colorPair]["GIH WR"]["μ"]
                        let xPosMeanGIH = startOfGIH + 200 + (meanGIH - winrateTicksGIH[0]) * 10
                        stroke(0, 0, 50)
                        strokeWeight(3)
                        line(xPosWinrateGIH, yPos, xPosMeanGIH, yPos)

                        stroke(0, 0, 100)
                        strokeWeight(5)
                        point(xPosWinrateGIH, yPos)

                        stroke(0, 0, 75)
                        strokeWeight(4)
                        point(xPosMeanGIH, yPos)

                        drawStDevTicks(
                            winrateTicksGIH, winrateGIH,
                            meanGIH, winrateStatistics[colorPair]["GIH WR"]["σ"],
                            startOfGIH + 210, yPos)
                    }
                    if (cardsWithEnoughOHData.includes(cardName)) {
                        let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
                        let xPosWinrateOH = startOfOH + 200 + (winrateOH - winrateTicksOH[0]) * 10
                        let meanOH = winrateStatistics[colorPair]["OH WR"]["μ"]
                        let xPosMeanOH = startOfOH + 200 + (meanOH - winrateTicksOH[0]) * 10
                        stroke(0, 0, 50)
                        strokeWeight(3)
                        line(xPosWinrateOH, yPos, xPosMeanOH, yPos)

                        stroke(0, 0, 100)
                        strokeWeight(5)
                        point(xPosWinrateOH, yPos)

                        stroke(0, 0, 75)
                        strokeWeight(4)
                        point(xPosMeanOH, yPos)

                        drawStDevTicks(
                            winrateTicksOH, winrateOH,
                            meanOH, winrateStatistics[colorPair]["OH WR"]["σ"],
                            startOfOH + 210, yPos)
                    }

                    noStroke()

                    yPos += 30
                }
            }
            cardsDisplayedLastFrame = cardsDisplayedThisFrame
            heightNeeded = yPos + 50
            fill(0, 0, 50)
            textAlign(LEFT, TOP)
            text("Some cards might not have enough data (<500 samples). Cards that do not have enough data won't have winrates.", 10, yPos + 30)

            // display the SVG color selectors
            // iterate through each color ("in" accesses color, which we'll need)
            noFill()
            strokeWeight(2)
            for (let color in SVGsOn) {
                let colorData = SVGsOn[color]
                tint(0, 0, 25)
                stroke(0, 0, 25)
                if (colorData[0]) { // is the SVG on?
                    tint(colorData[1][0], colorData[1][1], colorData[1][2])
                    stroke(colorData[1][0], colorData[1][1], colorData[1][2])
                }
                // draw rectangle and SVG
                rect(colorData[2], 15, 36, 36)
                image(WUBRGSVGs[color], colorData[2] + 3, 18, 30, 30)
            }
            tint(0, 0, 100)
            noStroke()

            // toggle save
            fill(0, 0, 25)
            if (mouseX > 600 && mouseX < 650 &&
                mouseY > 10 && mouseY < 30) fill(0, 0, 20)
            rect(600, 10, 50, 20)
            textSize(20)
            fill(0, 0, 100)
            text("SAVE", 600, 7)
            if (cardsSaved) {
                textSize(10)
                fill(120, 100, 50)
                stroke(120, 100, 50)
                strokeWeight(0.5)
                text("Cards have been saved", 600, 32)
            }
        }
    }

    // /* debugCorner needs to be last so its z-index is highest */
    // debugCorner.setText(`frameCount: ${frameCount}`, 2)
    // debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    // debugCorner.showBottom()

    // if (frameCount > 3000)
    //     noLoop()
}

function findSampleTicks(maximumValueNeededToRepresent) {
    let zeroTick = "0" // the string representation for 0. 0, 0K, or 0M.
    let oneTick = "5" // the string representation for the first tick.
    let twoTick = "10" // the string representation for the second tick.
    let oneTickNum = 5 // the number representation for the first tick.

    // continue progressing as the maximum value needed to represent gets larger
    if (maximumValueNeededToRepresent > 10) {
        oneTick = "15"
        twoTick = "30"
        oneTickNum = 15
    } if (maximumValueNeededToRepresent > 30) {
        oneTick = "30"
        twoTick = "60"
        oneTickNum = 30
    } if (maximumValueNeededToRepresent > 60) {
        zeroTick = "0K"
        oneTick = "0.1K"
        twoTick = "0.2K"
        oneTickNum = 100
    } if (maximumValueNeededToRepresent > 200) {
        oneTick = "0.25K"
        twoTick = "0.5K"
        oneTickNum = 250
    } if (maximumValueNeededToRepresent > 500) {
        oneTick = "0.5K"
        twoTick = "1K"
        oneTickNum = 500
    } if (maximumValueNeededToRepresent > 1000) {
        oneTick = "1K"
        twoTick = "2K"
        oneTickNum = 1000
    } if (maximumValueNeededToRepresent > 2000) {
        oneTick = "2.5K"
        twoTick = "5K"
        oneTickNum = 2500
    } if (maximumValueNeededToRepresent > 5000) {
        oneTick = "6K"
        twoTick = "12K"
        oneTickNum = 6000
    } if (maximumValueNeededToRepresent > 12000) {
        oneTick = "15K"
        twoTick = "30K"
        oneTickNum = 15000
    } if (maximumValueNeededToRepresent > 30000) {
        oneTick = "50K"
        twoTick = "100K" // this is the reason why we're not using simplifyNum here: this would say 0.1M, and we don't want that to happen
        oneTickNum = 50000
    } if (maximumValueNeededToRepresent > 100000) {
        zeroTick = "0M"
        oneTick = "0.1M"
        twoTick = "0.2M"
        oneTickNum = 100000
    } if (maximumValueNeededToRepresent > 200000) {
        oneTick = "0.25M"
        twoTick = "0.5M"
        oneTickNum = 250000
    } if (maximumValueNeededToRepresent > 500000) {
        oneTick = "0.5M"
        twoTick = "1M"
        oneTickNum = 500000
    } if (maximumValueNeededToRepresent > 1000000) {
        oneTick = "1M"
        twoTick = "2M"
        oneTickNum = 1000000
    } if (maximumValueNeededToRepresent > 2000000) {
        oneTick = "2.5M"
        twoTick = "5M"
        oneTickNum = 2500000
    } if (maximumValueNeededToRepresent > 5000000) {
        oneTick = "6M"
        twoTick = "12M"
        oneTickNum = 6000000
    } if (maximumValueNeededToRepresent > 12000000) {
        oneTick = "15M"
        twoTick = "30M"
        oneTickNum = 15000000
    } if (maximumValueNeededToRepresent > 30000000) {
        oneTick = "50M"
        twoTick = "100M"
        oneTickNum = 50000000
    }

    return [zeroTick, oneTick, twoTick, oneTickNum]
}

function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    let justEnteredSearch = false
    // there is "option" in STATS too
    if (displayState === "STATS") {
        if (keyCode === ENTER) {
            if (keyIsDown(CONTROL)) {
                displayState = "SEARCH"

                // use CTRL+ENTER to toggle
                // without this, then CTRL+ENTER on STATS switches to SEARCH and then goes back to STATS
                justEnteredSearch = true
                if (!cardsSaved) cardsSelected = []
                cardsSaved = false
            } else {
                cardsSelected = [cardsSelected[(option + cardsSelected.length * 10000) % cardsSelected.length]]
            }
        }
        if (keyCode === UP_ARROW) {
            option -= 1
        }
        if (keyCode === DOWN_ARROW) {
            option += 1
        }
        // if W, U, B, R, or G is pressed in the multi-card popup screen, toggle that color
        if (["W", "U", "B", "R", "G", "w", "u", "b", "r", "g"].includes(key) && cardsSelected.length > 1) {
            toggleColor(key.toUpperCase())
        }
    }
    if (displayState === "SEARCH") {
        if ([ // all letters able to type, preventing things like F12 from being added
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
                cardsExpanded = false
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
            cardsExpanded = false
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
                    heightNeeded = 0
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

// toggles the color, and sets the color pair as necessary
function toggleColor(colorPressed) {
    let turnedOff = false
    let turnedOn = false
    // toggles the color!
    for (let color in SVGsOn) { // iterate through keys
        if (color === colorPressed) {
            if (SVGsOn[color][0]) {
                turnedOff = true
                SVGsOn[color][0] = false
            } else if (!SVGsOn[0] && colorsSelected !== 2) {// you can't select a third color.
                turnedOn = true
                SVGsOn[color][0] = true
            }
        }
    }

    if (turnedOff) {
        colorsSelected -= 1
    } if (turnedOn) {
        colorsSelected += 1
    }

    if (colorsSelected === 2) { // set to color pair!
        colorPair = ""
        for (let color in SVGsOn) {
            if (SVGsOn[color][0] === true) {
                colorPair += color
            }
        }
    } if (colorsSelected === 0) { // reset color pair
        colorPair = "all"
    }
}

function mousePressed() {
    // check for W, U, B, R, and G presses
    if (displayState === "STATS") {
        if (cardsSelected.length > 1) {
            if (mouseY > 3 && mouseY < 39) {
                let xPosMinW = 200
                let xPosMaxW = 236
                let UOffset = 40
                let BOffset = 80
                let ROffset = 120
                let GOffset = 160
                if (mouseX > xPosMinW && mouseX < xPosMaxW) toggleColor("W")
                if (mouseX > xPosMinW + UOffset && mouseX < xPosMaxW + UOffset) toggleColor("U")
                if (mouseX > xPosMinW + BOffset && mouseX < xPosMaxW + BOffset) toggleColor("B")
                if (mouseX > xPosMinW + ROffset && mouseX < xPosMaxW + ROffset) toggleColor("R")
                if (mouseX > xPosMinW + GOffset && mouseX < xPosMaxW + GOffset) toggleColor("G")
            }
            if (mouseX > 400 && mouseX < 500 &&
                mouseY > 8 && mouseY < 30) {
                if (calibre === "ALL") {
                    calibre = "TOP"
                    data = dataTop
                    winrateStatistics = winrateStatisticsTop
                } else {
                    calibre = "ALL"
                    data = dataAll
                    winrateStatistics = winrateStatisticsAll
                }
            } if (mouseX > 510 && mouseX < 590 &&
                  mouseY > 8 && mouseY < 30) {
                if (sortingMethod === "OH" || sortingMethod === "MIX") sortingMethod = "GIH"
                else sortingMethod = "OH"
            } if (mouseX > 510 && mouseX < 590 &&
                  mouseY > 30 && mouseY < 46) sortingMethod = "MIX"
            if (mouseX > 600 && mouseX < 650 &&
                mouseY > 10 && mouseY < 30) cardsSaved = true
        } if (cardsSelected.length === 1) {
            if (mouseX > 185 && mouseX < 285 &&
                mouseY > 38 && mouseY < 60) {
                if (calibre === "ALL") {
                    calibre = "TOP"
                    data = dataTop
                    winrateStatistics = winrateStatisticsTop
                } else {
                    calibre = "ALL"
                    data = dataAll
                    winrateStatistics = winrateStatisticsAll
                }
            }
        }
    } else {
        // press expand/collapse button
        if (mouseX > width - 40 && mouseX < width - 10 &&
            mouseY > 410 && mouseY < 435) {
            cardsExpanded = true
            print(cardsExpanded)
            print("toggled")
        }
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