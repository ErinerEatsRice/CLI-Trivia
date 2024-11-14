import axios from 'axios'
import inquirer from 'inquirer'
import { createSpinner } from 'nanospinner'
import figlet from 'figlet'
import chalk from 'chalk'
import chalkAnimation from 'chalk-animation'
import { decode } from 'html-entities'

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms))

Array.prototype.shuffleArray = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this[i], this[j]] = [this[j], this[i]]
    }
    return this
}

const ascii = (data) => {
    return new Promise((resolve, reject) => {
        figlet(data, (err, d) => {
            if (err) {
                reject('Something went wrong.')
            } else {
                const rainbowTitle = chalkAnimation.rainbow(d)
                setTimeout(() => {
                    rainbowTitle.stop()
                    resolve(d)
                }, 2000)
            }
        })
    })
}

let wrongCount = 0
let playerName
let difficultyLevel

async function welcome () {
    await ascii('WELCOME TO TRIVIA')
}

async function start () {
    console.log(chalk.blueBright('\n===================================='))
    console.log(chalk.yellowBright('TRIVIA GAME - LET\'S GET STARTED!'))
    console.log(chalk.blueBright('====================================\n'))
    console.log(chalk.bgBlueBright('You only get 10 seconds to answer or else the game will end.'))

    const nameQues = await inquirer.prompt({
        name: 'nameQues',
        type: 'input',
        message: chalk.green('What is your name?'),
        default() {
            return 'Player'
        }
    })

    playerName = nameQues.nameQues
    console.log(chalk.magenta(`\nHi, ${playerName}. Welcome to our console Trivia Game!\n`))
}

async function askDifficulty () {
    const difficultyQues = await inquirer.prompt({
        name: 'difficultyQues',
        type: 'list',
        message: chalk.green('Choose your difficulty level:'),
        choices: ['Easy', 'Medium', 'Hard']
    })
    difficultyLevel = difficultyQues.difficultyQues
}

async function handleAnswer (isCorrect) {
    const spinner = createSpinner('Checking answer...').start()
    await sleep(2000)

    if (isCorrect) {
        spinner.success({ text: `Well done, ${playerName}. You got the correct answer.` })
        await triviaQues()
    } else {
        wrongCount++
        spinner.error({ text: `You got the answer wrong. You still have ${3 - wrongCount} attempt(s) left to answer.` })

        if (wrongCount < 3) {
            await triviaQues()
        } else {
            console.log(chalk.red(`\nGame over! You messed up for very last chance to answer.\n`))
            process.exit()
        }
    }
}

async function askQuestion () {
    const data = await axios.get(`https://opentdb.com/api.php?amount=1&difficulty=${difficultyLevel || 'easy'}&type=multiple`)
    const questionData = data.data.results[0]
    const { question, correct_answer, incorrect_answers } = questionData
    const answers = [correct_answer, ...incorrect_answers].shuffleArray()

    const timeout = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 10000)
    })

    const answer = await Promise.race([
        inquirer.prompt({
            name: 'triviaQues',
            type: 'list',
            message: chalk.cyan(decode(question)),
            choices: answers.map(answer => chalk.yellow(decode(answer)))
        }),
        timeout
    ])

    return { answer, correct_answer }
}

async function triviaQues () {
    try {
        const { answer, correct_answer } = await askQuestion()

        if (answer === 'timeout') {
            console.log(chalk.red(`\nTime is up!`))
            await sleep (3000)
            process.stdout.write('\x1Bc')
        } else {
            await handleAnswer(answer.triviaQues === correct_answer)
        }

    } catch (error) {
        console.log(error)
        process.exit()
    }
}

await welcome()
await start()
await askDifficulty()
await triviaQues()