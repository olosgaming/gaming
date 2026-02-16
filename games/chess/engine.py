
import chess

class ChessEngine:
    def __init__(self):
        self.board = chess.Board()

    def make_move(self, uci_move: str):
        move = chess.Move.from_uci(uci_move)
        if move in self.board.legal_moves:
            self.board.push(move)
            return True
        return False

    def get_fen(self):
        return self.board.fen()

    def reset(self):
        self.board.reset()
