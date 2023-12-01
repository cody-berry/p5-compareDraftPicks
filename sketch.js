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
let winrateStatistics
let cardNames

let searchBox = ""
let option
let cardsSelected = []
let addSelectedOptionToCards = false

let heightNeeded = 0
let gradeColors

let images
let WUBRG

let displayState = "SEARCH"


function preload() {
    font = loadFont('data/meiryo.ttf')
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')
    data = loadJSON("json/master.json", loadImages)
    winrateStatistics = loadJSON("json/statistics.json")
    WUBRG = {
        "W": loadImage("WUBRG/W.png"),
        "U": loadImage("WUBRG/U.png"),
        "B": loadImage("WUBRG/B.png"),
        "R": loadImage("WUBRG/R.png"),
        "G": loadImage("WUBRG/G.png")
    }
}

function loadImages(data) {
    images = {}
    for (let cardName of Object.keys(data)) {
        images[cardName] = loadImage(data[cardName]["all"]["url"])
    }
}

function calculateGrade(zScore) {
    let result

    // special: S
    if (zScore > 3.25)
        result = "S"
    // A range
    else if (zScore > (2.5 - 1 / 3))
        result = "A+"
    else if (zScore > (1.5 + 1 / 3))
        result = "A"
    else if (zScore > 1.5)
        result = "A-"
    // B range
    else if (zScore > (1.5 - 1 / 3))
        result = "B+"
    else if (zScore > (0.5 + 1 / 3))
        result = "B"
    else if (zScore > 0.5)
        result = "B-"
    // C range
    else if (zScore > (0.5 - 1 / 3))
        result = "C+"
    else if (zScore > (-0.5 + 1 / 3))
        result = "C"
    else if (zScore > -0.5)
        result = "C-"
    // D range
    else if (zScore > (-0.5 - 1 / 3))
        result = "D+"
    else if (zScore > (-1.5 + 1 / 3))
        result = "D"
    else if (zScore > -1.5)
        result = "D-"
    // E range
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

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

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
        // display headers
        // find out ticks for OH WR and GIH WR, which means finding the
        // maximum OH WR and GIH WR values
        // also find out ticks
        let startOfOH = 240
        let startOfGIH = startOfOH + 200
        let widthNeeded = startOfGIH + 200
        let maxSamplesOH = 0
        let maxSamplesGIH = 0
        let maxWinrateOH = 0
        let minWinrateOH = 100
        let maxWinrateGIH = 0
        let minWinrateGIH = 100
        let cardsWithEnoughData = []
        for (let cardName of cardsSelected) {
            let cardStats = data[cardName]["all"]
            if (cardStats["OH WR"] !== "") { // check for enough data
                maxSamplesOH = max(maxSamplesOH, cardStats["# OH"])
                maxSamplesGIH = max(maxSamplesGIH, cardStats["# GD"])

                minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))

                cardsWithEnoughData.push(cardName)
            }
        }
        minWinrateOH = parseInt(min(minWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
        maxWinrateOH = parseInt(max(maxWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
        minWinrateGIH = parseInt(min(minWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))
        maxWinrateGIH = parseInt(max(maxWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))
        cardsSelected = cardsWithEnoughData
        // make sure there are actually cards with enough data!
        if (cardsSelected.length === 0) {
            resizeCanvas(200, 150)
            background(0, 0, 0)
            fill(0, 0, 100)
            noStroke()
            textAlign(LEFT, TOP)
            text("There are no cards that \nhave enough data.", 0, 0)
            text("Please press Ctrl+Enter to \nreturn to searching.", 0, 50)
            stroke(0, 0, 100)
            strokeWeight(1)
            text("Cards you selected will \nnot be saved.", 0, 100)
        } else if (cardsSelected.length === 1) { // special case: diplay color pairs
            // find out ticks for OH WR and GIH WR, which means finding the
            // maximum OH WR and GIH WR values
            let startingYPos = height/2 - 70
            let startOfOH = 360
            let startOfGIH = startOfOH + 210
            let widthNeeded = startOfGIH + 210
            let maxSamplesOH = 0
            let maxSamplesGIH = 0
            let maxWinrateOH = 0
            let minWinrateOH = 100
            let maxWinrateGIH = 0
            let minWinrateGIH = 100
            let colorPairsWithEnoughData = []
            for (let colorPair of [
                "WU", "WB", "WR", "WG",
                "UB", "UR", "UG",
                "BR", "BG", "RG"
            ]) {
                let cardStats = data[cardsSelected[0]][colorPair]
                if (cardStats["OH WR"] !== "") { // check for enough data
                    maxSamplesOH = max(maxSamplesOH, cardStats["# OH"])
                    maxSamplesGIH = max(maxSamplesGIH, cardStats["# GD"])

                    minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                    maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
                    minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
                    maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))

                    minWinrateOH = min(minWinrateOH, round(winrateStatistics[colorPair]["OH WR"]["μ"]*10)/10)
                    maxWinrateOH = max(maxWinrateOH, round(winrateStatistics[colorPair]["OH WR"]["μ"]*10)/10)
                    minWinrateGIH = min(minWinrateGIH, round(winrateStatistics[colorPair]["GIH WR"]["μ"*10]/10))
                    maxWinrateGIH = max(maxWinrateGIH, round(winrateStatistics[colorPair]["GIH WR"]["μ"*10]/10))

                    colorPairsWithEnoughData.push(colorPair)

                    startingYPos -= 30
                }
            }
            let cardStats = data[cardsSelected[0]]["all"]
            minWinrateOH = min(minWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
            maxWinrateOH = max(maxWinrateOH, cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1))
            minWinrateGIH = min(minWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))
            maxWinrateGIH = max(maxWinrateGIH, cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1))

            minWinrateOH = parseInt(min(minWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
            maxWinrateOH = parseInt(max(maxWinrateOH, round(winrateStatistics["all"]["OH WR"]["μ"]*10)/10))
            minWinrateGIH = parseInt(min(minWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))
            maxWinrateGIH = parseInt(max(maxWinrateGIH, round(winrateStatistics["all"]["GIH WR"]["μ"]*10)/10))

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
            let winrateTicksGIH = []
            let winrateTicksOH = []

            if (frameCount % 30 === 0) {
                print(minWinrateOH, maxWinrateOH, minWinrateGIH, maxWinrateGIH)
                print(minWinrateOH - (maxWinrateOH - minWinrateOH)/10, maxWinrateOH + (maxWinrateOH - minWinrateOH)/4,
                      minWinrateGIH - (maxWinrateGIH - minWinrateGIH)/10, maxWinrateGIH + (maxWinrateGIH - minWinrateGIH)/4)
            }

            // iterate through every tick needed for OH and GIH (increments of 5)
            for (let i = minWinrateOH - (maxWinrateOH - minWinrateOH)/10; i < maxWinrateOH + (maxWinrateOH - minWinrateOH)/4; i += 5) {
                winrateTicksOH.push(Math.round(i))
                startOfGIH += 50
                widthNeeded += 50
            }
            for (let i = minWinrateGIH - (maxWinrateGIH - minWinrateGIH)/10; i < maxWinrateGIH + (maxWinrateGIH - minWinrateGIH)/4; i += 5) {
                winrateTicksGIH.push(Math.round(i))
                widthNeeded += 50
            }

            // now actually display the screen
            resizeCanvas(widthNeeded, 500)
            background(0, 0, 0)

            textSize(50)
            fill(0, 0, 100)
            stroke(0, 0, 100)
            strokeWeight(3)
            textAlign(LEFT, TOP)
            text("STATS", 10, 0)

            // display the image for the card
            let imageToDisplay = images[cardsSelected[0]]
            image(imageToDisplay, 0, 60, 308, 429)

            // display the OH and GIH grades
            fill(0, 0, 50)
            noStroke()
            rect(startOfOH, startingYPos + 30, 50, 50, 5)

            cardStats = data[cardsSelected[0]]["all"]
            let grade = calculateGrade(cardStats["zScoreOH"])
            fill(gradeColors[grade][0],
                gradeColors[grade][1],
                gradeColors[grade][2])
            stroke(gradeColors[grade][0],
                gradeColors[grade][1],
                gradeColors[grade][2])
            strokeWeight(2)
            textSize(25)
            textAlign(CENTER, CENTER)
            text(grade, startOfOH + 25, startingYPos + 52)


            fill(0, 0, 50)
            noStroke()
            rect(startOfGIH, startingYPos + 30, 50, 50, 5)


            grade = calculateGrade(cardStats["zScoreGIH"])
            fill(gradeColors[grade][0],
                gradeColors[grade][1],
                gradeColors[grade][2])
            stroke(gradeColors[grade][0],
                gradeColors[grade][1],
                gradeColors[grade][2])
            text(grade, startOfGIH + 25, startingYPos + 52)

            // display the ticks
            fill(0, 0, 50)
            textSize(12)
            noStroke()
            textAlign(LEFT, TOP)
            text(zeroTickOH, startOfOH + 52, startingYPos)
            text(oneTickOH, startOfOH + 102, startingYPos)
            text(twoTickOH, startOfOH + 152, startingYPos)

            text(zeroTickGIH, startOfGIH + 52, startingYPos)
            text(oneTickGIH, startOfGIH + 102, startingYPos)
            text(twoTickGIH, startOfGIH + 152, startingYPos)

            stroke(0, 0, 50)
            strokeWeight(1)

            // display the lines under the ticks to help users tell how
            // many samples there are for a card
            line(startOfOH + 60, startingYPos + 20, startOfOH + 60, 115 + startingYPos + colorPairsWithEnoughData.length*60)
            line(startOfOH + 110, startingYPos + 20, startOfOH + 110, 115 + startingYPos + colorPairsWithEnoughData.length*60)
            line(startOfOH + 160, startingYPos + 20, startOfOH + 160, 115 + startingYPos + colorPairsWithEnoughData.length*60)
            line(startOfGIH + 60, startingYPos + 20, startOfGIH + 60, 115 + startingYPos + colorPairsWithEnoughData.length*60)
            line(startOfGIH + 110, startingYPos + 20, startOfGIH + 110, 115 + startingYPos + colorPairsWithEnoughData.length*60)
            line(startOfGIH + 160, startingYPos + 20, startOfGIH + 160, 115 + startingYPos + colorPairsWithEnoughData.length*60)

            // now display the winrate ticks
            let xPos = startOfOH + 210
            for (let winrateTick of winrateTicksOH) {
                noStroke()
                text(winrateTick + "%", xPos - 8, startingYPos)
                stroke(0, 0, 50)
                line(xPos, startingYPos + 20, xPos, 115 + startingYPos + colorPairsWithEnoughData.length*60)
                xPos += 50
            }
            xPos = startOfGIH + 210
            for (let winrateTick of winrateTicksGIH) {
                noStroke()
                text(winrateTick + "%", xPos - 8, startingYPos)
                stroke(0, 0, 50)
                line(xPos, startingYPos + 20, xPos, 115 + startingYPos + colorPairsWithEnoughData.length*60)
                xPos += 50
            }

            // display the samples
            let samplesOH = cardStats["# OH"]
            let samplesGIH = cardStats["# GD"]

            noStroke()
            fill(0, 0, 100)
            textSize(20)
            text((samplesOH > 100000) ? (round(samplesOH/10)/100000 + "M") : (round(samplesOH/10)/100 + "K"), startOfOH + 60, startingYPos + 52)
            text((samplesGIH > 100000) ? (round(samplesGIH/10)/100000 + "M") : (round(samplesGIH/10)/100 + "K"), startOfGIH + 60, startingYPos + 52)

            // display the winrate
            let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
            let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
            let meanOH = winrateStatistics["all"]["OH WR"]["μ"]
            let meanGIH = winrateStatistics["all"]["GIH WR"]["μ"]
            stroke(0, 0, 50)
            strokeWeight(3)
            line(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, startingYPos + 55,
                startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, startingYPos + 55)
            line(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, startingYPos + 55,
                startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, startingYPos + 55)

            stroke(0, 0, 100)
            strokeWeight(5)
            point(startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, startingYPos + 55)
            point(startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, startingYPos + 55)

            stroke(0, 0, 75)
            strokeWeight(4)
            point(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, startingYPos + 55)
            point(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, startingYPos + 55)

            // repeat for all available color pairs
            let yPos = startingYPos + 115
            for (let colorPair of colorPairsWithEnoughData) {
                // display the calibre
                xPos = startOfOH - 55*3/4 - 2
                for (let letter of colorPair) {
                    imageMode(CENTER)
                    image(WUBRG[letter], xPos, yPos, 30, 30)
                    imageMode(CORNER)

                    xPos += 55/2
                }

                // display the OH and GIH grades
                noStroke()
                fill(0, 0, 50)
                rect(startOfOH, yPos - 25, 50, 50, 5)


                cardStats = data[cardsSelected[0]][colorPair]
                let grade = calculateGrade(cardStats["zScoreOH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(2)
                textSize(25)
                textAlign(CENTER, CENTER)
                text(grade, startOfOH + 25, yPos - 3)


                fill(0, 0, 50)
                noStroke()
                rect(startOfGIH, yPos - 25, 50, 50, 5)


                grade = calculateGrade(cardStats["zScoreGIH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                text(grade, startOfGIH + 25, yPos - 3)

                // display the samples
                let samplesOH = cardStats["# OH"]
                let samplesGIH = cardStats["# GD"]

                noStroke()
                fill(0, 0, 100)
                rect(startOfOH + 60, yPos - 4, (samplesOH/oneTickNumOH)*50, 8, 0, 4, 4, 0)
                rect(startOfGIH + 60, yPos - 4, (samplesGIH/oneTickNumGIH)*50, 8, 0, 4, 4, 0)

                // display the winrate
                stroke(0, 0, 100)
                strokeWeight(5)
                let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
                let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
                let meanOH = winrateStatistics[colorPair]["OH WR"]["μ"]
                let meanGIH = winrateStatistics[colorPair]["GIH WR"]["μ"]
                stroke(0, 0, 50)
                strokeWeight(3)
                line(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, yPos,
                    startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, yPos)
                line(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, yPos,
                    startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, yPos)

                stroke(0, 0, 100)
                strokeWeight(5)
                point(startOfOH + 210 + (winrateOH - winrateTicksOH[0])*10, yPos)
                point(startOfGIH + 210 + (winrateGIH - winrateTicksGIH[0])*10, yPos)

                stroke(0, 0, 75)
                strokeWeight(4)
                point(startOfOH + 210 + (meanOH - winrateTicksOH[0])*10, yPos)
                point(startOfGIH + 210 + (meanGIH - winrateTicksGIH[0])*10, yPos)

                yPos += 60
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
            let winrateTicksGIH = []
            let winrateTicksOH = []
            // iterate through every tick needed for OH and GIH (increments of 5)
            for (let i = minWinrateOH - (maxWinrateOH - minWinrateOH)/10; i < maxWinrateOH + (maxWinrateOH - minWinrateOH)/4; i += 5) {
                winrateTicksOH.push(Math.round(i))
                startOfGIH += 50
                widthNeeded += 50
            }
            for (let i = minWinrateGIH - (maxWinrateGIH - minWinrateGIH)/10; i < maxWinrateGIH + (maxWinrateGIH - minWinrateGIH)/4; i += 5) {
                winrateTicksGIH.push(Math.round(i))
                widthNeeded += 50
            }

            // now actually display the headers and ticks
            resizeCanvas(widthNeeded, heightNeeded)
            background(0, 0, 0)

            textSize(50)
            fill(0, 0, 100)
            stroke(0, 0, 100)
            strokeWeight(3)
            textAlign(LEFT, TOP)
            text("STATS", 10, 0)
            fill(0, 0, 50)
            noStroke()
            textSize(12)
            text("Name", 10, 65)

            fill(0, 0, 100)
            text("OH", startOfOH, 65)
            text("GD", startOfGIH, 65)

            fill(0, 0, 50)
            text(zeroTickOH, startOfOH + 42, 65)
            text(oneTickOH, startOfOH + 92, 65)
            text(twoTickOH, startOfOH + 142, 65)

            text(zeroTickGIH, startOfGIH + 42, 65)
            text(oneTickGIH, startOfGIH + 92, 65)
            text(twoTickGIH, startOfGIH + 142, 65)

            stroke(0, 0, 50)
            strokeWeight(1)

            // display the lines under the ticks to help users tell how
            // many samples there are for a card
            line(startOfOH + 50, 85, startOfOH + 50, heightNeeded - 65)
            line(startOfOH + 100, 85, startOfOH + 100, heightNeeded - 65)
            line(startOfOH + 150, 85, startOfOH + 150, heightNeeded - 65)
            line(startOfGIH + 50, 85, startOfGIH + 50, heightNeeded - 65)
            line(startOfGIH + 100, 85, startOfGIH + 100, heightNeeded - 65)
            line(startOfGIH + 150, 85, startOfGIH + 150, heightNeeded - 65)

            // now display the winrate ticks
            let xPos = startOfOH + 200
            for (let winrateTick of winrateTicksOH) {
                noStroke()
                text(winrateTick + "%", xPos - 8, 65)
                stroke(0, 0, 50)
                line(xPos, 85, xPos, heightNeeded - 65)
                xPos += 50
            }
            xPos = startOfGIH + 200
            for (let winrateTick of winrateTicksGIH) {
                noStroke()
                text(winrateTick + "%", xPos - 8, 65)
                stroke(0, 0, 50)
                line(xPos, 85, xPos, heightNeeded - 65)
                xPos += 50
            }

            noStroke()

            // display card list
            let i = 0
            let yPos = 100
            textSize(15)
            textAlign(LEFT, CENTER)
            for (let cardName of cardsSelected) {
                i += 1

                // display the alternating table color
                fill(0, 0, 40 + 20 * (i % 2), 50)

                // if it is the selected option, make it orange
                // "+ matchedNames.length*10000" ensures that negative options
                // don't prompt no card display
                if (i - 1 === (option + cardsSelected.length * 10000) % cardsSelected.length) {
                    fill(30, 100, 90 + 10 * (i % 2), 50)
                }

                rect(0, yPos - 15, width, 30)

                // display the card name
                fill(0, 0, 100)
                text(cardName, 10, yPos - 3)

                // find out the grades and display them
                let cardStats = data[cardName]["all"]

                // OH
                let grade = calculateGrade(cardStats["zScoreOH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(1)
                text(grade, startOfOH, yPos - 2)

                // display the rectangle for the samples as well
                noStroke()
                fill(0, 0, 100)
                rect(startOfOH + 50, yPos - 4, (cardStats["# OH"] / oneTickNumOH) * 50, 8, 0, 4, 4, 0)

                // GIH
                grade = calculateGrade(cardStats["zScoreGIH"])
                fill(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                stroke(gradeColors[grade][0],
                    gradeColors[grade][1],
                    gradeColors[grade][2])
                strokeWeight(1)
                text(grade, startOfGIH, yPos - 2)

                // display the rectangle for the samples as well
                noStroke()
                fill(0, 0, 100)
                rect(startOfGIH + 50, yPos - 4, (cardStats["# GD"] / oneTickNumGIH) * 50, 8, 0, 4, 4, 0)

                // display the point for the winrate
                let winrateGIH = cardStats["GIH WR"].substring(0, cardStats["GIH WR"].length - 1)
                let winrateOH = cardStats["OH WR"].substring(0, cardStats["OH WR"].length - 1)
                let meanGIH = winrateStatistics["all"]["GIH WR"]["μ"]
                let meanOH = winrateStatistics["all"]["OH WR"]["μ"]
                stroke(0, 0, 50)
                strokeWeight(3)
                line(startOfGIH + 200 + (winrateGIH - winrateTicksGIH[0])*10, yPos,
                    startOfGIH + 200 + (meanGIH - winrateTicksGIH[0])*10, yPos)
                line(startOfOH + 200 + (winrateOH - winrateTicksOH[0])*10, yPos,
                    startOfOH + 200 + (meanOH - winrateTicksOH[0])*10, yPos)

                stroke(0, 0, 100)
                strokeWeight(5)
                point(startOfGIH + 200 + (winrateGIH - winrateTicksGIH[0])*10, yPos)
                point(startOfOH + 200 + (winrateOH - winrateTicksOH[0])*10, yPos)

                stroke(0, 0, 75)
                strokeWeight(4)
                point(startOfGIH + 200 + (meanGIH - winrateTicksGIH[0])*10, yPos)
                point(startOfOH + 200 + (meanOH - winrateTicksOH[0])*10, yPos)

                noStroke()

                yPos += 30
            }
            heightNeeded = yPos + 50
            fill(0, 0, 50)
            textAlign(LEFT, TOP)
            text("Some cards might not have enough data (<500 samples). Those" +
                " will not be showed \nhere.", 10, yPos - 10)
            text("Cards that do not have enough data won't have winrates.", 10, yPos + 30)
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
    let zeroTick = "0K" // the string representation for 0. 0K or 0M.
    let oneTick = "0.1K" // the string representation for the first tick.
    let twoTick = "0.2K" // the string representation for the second tick.
    let oneTickNum = 100 // the number representation for the first tick.

    if (maximumValueNeededToRepresent > 200) {
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
        twoTick = "100K"
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
    if (displayState === "STATS") {
        if (keyCode === ENTER) {
            if (keyIsDown(CONTROL)) {
                displayState = "SEARCH"
                justEnteredSearch = true
                cardsSelected = []
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