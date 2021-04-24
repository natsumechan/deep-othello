import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as _ from "lodash"
import {Setting} from "./setting";

type SquareProps = {
    value: string | null;
    onClick: () => void;
};


class Square extends React.Component<SquareProps> {
    render() {
        return (
            <button className="square" onClick={() => this.props.onClick()}>
                {this.props.value}
            </button>
        );
    }
}

type SquareType = null | "●" | "○"

type BoardProps = {
    squares: Array<Array<SquareType>>;
    onClick: (i: number) => void;
};

class Board extends React.Component<BoardProps> {
    renderSquare(i: number) {
        // 二次元配列に変換
        const x = i % Setting.LENGTH
        const y = Math.floor(i / Setting.LENGTH)
        return (
            <Square
                value={this.props.squares[y][x]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    Content(i: number) {
        let content = []
        for (let j = i; j < i + Setting.LENGTH; j++) {
            content.push(this.renderSquare(j))
        }
        return content;
    }

    render() {
        let items: Array<JSX.Element> = [];
        for (let i = 0; i < Setting.LENGTH ** 2; i = i + Setting.LENGTH) {
            items.push(<div className="board-row" key={i}>{this.Content(i)}</div>);
        }
        return (
            <div>
                {items}
            </div>);
    }
}

type HistoryData = {
    squares: Array<Array<SquareType>>;
};

type GameState = {
    history: HistoryData[];
    xIsNext: boolean;
    stepNumber: number;
};

class Game extends React.Component<{}, GameState> {
    constructor(props: {}) {
        super(props);
        let tbl = Array(Setting.LENGTH);
        for (let y = 0; y < Setting.LENGTH; y++) {
            tbl[y] = Array(Setting.LENGTH).fill(null)
        }
        //盤面初期化
        tbl[3][3] = "○"
        tbl[3][4] = "●"
        tbl[4][3] = "●"
        tbl[4][4] = "○"
        this.state = {
            history: [
                {squares: tbl}
            ],
            xIsNext: true, // trueは●番
            stepNumber: 0,
        };
    }

    handleClick(i: number) {
        const x = i % Setting.LENGTH
        const y = Math.floor(i / Setting.LENGTH)
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        // const squares = current.squares.slice()
        const squares = _.cloneDeep(current.squares)
        const reverseStone = canPlaceStone(squares, x, y, this.state.xIsNext)
        if (reverseStone.length === 0 || squares[y][x]) {
            return;
        }
        // 石をおくところ
        squares[y][x] = this.state.xIsNext ? "●" : "○";
        reverseStone.forEach((coord: any) => {
            const [ny, nx] = coord;
            squares[ny][nx] = this.state.xIsNext ? "●" : "○";
        });
        this.setState(
            {
                history: history.concat([
                    {
                        squares: squares,
                    }
                ]),
                xIsNext: !this.state.xIsNext,
                stepNumber: history.length,
            }
        )

    }

    jumpTo(step: number) {
        this.setState({
            stepNumber: step,
            xIsNext: step % 2 === 0,
        });
    }


    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares, this.state.xIsNext);
        const moves = history.map((step, move) => {
            const desc = move ? " Go to move #" + move : "Go to game start"
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            )
        })
        // 勝者が決まっていない時は、おける状態かチェック
        if (!winner && !searchPlace(current.squares, this.state.xIsNext)) {
            this.setState(
                {
                    history: history.concat([
                        {
                            squares: current.squares,
                        }
                    ]),
                    xIsNext: !this.state.xIsNext,
                    stepNumber: history.length,
                }
            )
        }
        let status;
        if (winner) {
            status = "Winner :" + winner;
        } else {
            status = "Next player: " + (this.state.xIsNext ? "●" : "○");
        }
        let score;
        let cntWhite = current.squares.flat().filter((x) => {
            return x === "○"
        }).length;
        let cntBlack = current.squares.flat().filter((x) => {
            return x === "●"
        }).length;
        score = "White :" + cntWhite + " Black :" + cntBlack;
        return (
            <div className="game">
                <div className="game-board">
                    <header className="App-header">
                        <h1 className="App-title">Reversi</h1>
                    </header>
                    <div>{status}</div>
                    <div>{score}</div>
                    <Board
                        squares={current.squares}
                        onClick={(i) => this.handleClick(i)}
                    />
                    <div className="game-info">
                        <ol>{moves}</ol>
                    </div>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <Game/>,
    document.getElementById('root')
);

function canPlaceStone(squares: Array<Array<SquareType>>, x: number, y: number, xIsNext: Boolean) {
    let reverseStones: any = [];
    // y, xを動かしていく[y, x]
    const moves = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
    console.log(moves, "moves")
    const opponentStones = !xIsNext ? "●" : "○";
    const myStones = !xIsNext ? "○" : "●";
    moves.forEach((move) => {
        const [dy, dx] = move;
        let tmpStones = [];
        let ny = y;
        let nx = x;
        while (true) {
            ny += dy;
            nx += dx;
            // console.log(dy, dx)
            if (0 <= ny && ny < Setting.LENGTH && 0 <= nx && nx < Setting.LENGTH) {
                console.log(ny, nx, squares[ny][nx])
                if (squares[ny][nx] === opponentStones) {
                    tmpStones.push([ny, nx])
                } else if (squares[ny][nx] === myStones) {
                    reverseStones = reverseStones.concat(tmpStones)
                    break
                } else if (!squares[ny][nx]) {
                    break
                }
            } else {
                break
            }
        }
    });
    // console.log(reverseStones)
    return reverseStones
}

function searchPlace(squares: Array<Array<SquareType>>, xIsNext: boolean) {
    // https://proglight.jimdofree.com/programs/vba/othello/
    // 置けない時はパス
    for (let y = 0; y < Setting.LENGTH; y++) {
        for (let x = 0; x <= Setting.LENGTH - 1; x++) {
            if (squares[y][x] === null && canPlaceStone(squares, x, y, xIsNext).length > 0) {
                return true;
            }
        }
    }
    return false;
}

function calculateWinner(squares: Array<Array<SquareType>>, xIsNext: boolean) {
    // 両者とも全てのマスに置けないときに点数を計算
    if (!searchPlace(squares, xIsNext) && !searchPlace(squares, !xIsNext)) {
        let cntWhite = squares.flat().filter((x) => {
            return x === "○"
        }).length;
        let cntBlack = squares.flat().filter((x) => {
            return x === "●"
        }).length;
        let winner;
        if (cntWhite > cntBlack) {
            winner = "White";
        } else if (cntWhite < cntBlack) {
            winner = "Black";
        } else {
            winner = "Even";
        }
        return winner;
    }
    return null;
}