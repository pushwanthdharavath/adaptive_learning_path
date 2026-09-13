import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/PuzzleGame.css";

export default function PuzzleGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timer, setTimer] = useState(null);
  const [isSolvable, setIsSolvable] = useState(false);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const checkSolvable = useCallback((puzzle) => {
    let inversions = 0;
    const flatPuzzle = puzzle.filter(num => num !== null);
    
    for (let i = 0; i < flatPuzzle.length - 1; i++) {
      for (let j = i + 1; j < flatPuzzle.length; j++) {
        if (flatPuzzle[i] > flatPuzzle[j]) {
          inversions++;
        }
      }
    }
    
    return inversions % 2 === 0;
  }, []);

  const initializeBoard = useCallback(() => {
    let numbers;
    do {
      numbers = Array.from({ length: 8 }, (_, i) => i + 1);
      numbers.push(null); // Empty space
      numbers = shuffleBoard(numbers);
    } while (!checkSolvable(numbers));
    
    return numbers;
  }, [checkSolvable]);

  const shuffleBoard = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startGame = useCallback(() => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    setMoves(0);
    setGameStarted(true);
    setGameWon(false);
    setTimeElapsed(0);
    setIsSolvable(true);
    
    if (timer) clearInterval(timer);
    
    const newTimer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    setTimer(newTimer);
  }, [initializeBoard, timer]);

  const checkWin = useCallback((boardArray) => {
    for (let i = 0; i < boardArray.length - 1; i++) {
      if (boardArray[i] !== i + 1) return false;
    }
    return boardArray[boardArray.length - 1] === null;
  }, []);

  const handleMove = useCallback(async (index) => {
    if (!gameStarted || gameWon) return;

    const emptyIndex = board.indexOf(null);
    const row = Math.floor(index / 3);
    const emptyRow = Math.floor(emptyIndex / 3);
    const col = index % 3;
    const emptyCol = emptyIndex % 3;

    if (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    ) {
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      setBoard(newBoard);
      setMoves(moves + 1);

      if (checkWin(newBoard)) {
        setGameWon(true);
        clearInterval(timer);
        // Save game result
        try {
          await axios.post('/api/game/result', {
            gameType: 'puzzle',
            moves: moves + 1,
            timeElapsed: timeElapsed,
            completed: true
          });
        } catch (error) {
          console.error('Error saving game result:', error);
        }
      }
    }
  }, [board, checkWin, gameStarted, gameWon, moves, timeElapsed, timer]);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="puzzle-game-container">
      <div className="game-info">
        <h2>Space Slider Puzzle</h2>
        {gameStarted && (
          <div className="stats">
            <p>Moves: {moves}</p>
            <p>Time: {formatTime(timeElapsed)}</p>
          </div>
        )}
        <button className="back-button" onClick={() => navigate('/child-dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="puzzle-grid">
        {board.map((number, index) => (
          <button
            key={index}
            className={`puzzle-tile ${!number ? 'empty' : ''} ${
              number === index + 1 ? 'correct' : ''
            }`}
            onClick={() => handleMove(index)}
            disabled={!gameStarted || gameWon}
          >
            {number}
          </button>
        ))}
      </div>

      <div className="game-controls">
        <button
          className="start-button"
          onClick={startGame}
          disabled={!isSolvable && gameStarted}
        >
          {gameWon ? 'Play Again' : gameStarted ? 'Restart' : 'Start Game'}
        </button>
      </div>

      {gameWon && (
        <div className="game-over">
          <h3>Puzzle Solved! 🎉</h3>
          <p>Moves: {moves}</p>
          <p>Time: {formatTime(timeElapsed)}</p>
        </div>
      )}
    </div>
  );
}
