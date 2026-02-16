# Snake Game - Classic Pygame Implementation

A classic Snake game built entirely with Pygame, featuring smooth gameplay, sound effects, and progressive difficulty.

## Features

### Core Features
- **Snake Mechanics**: Grid-based movement with growing length when eating food
- **Collision Detection**: Game ends on self-collision or boundary collision
- **Food System**: Random food spawning at valid positions
- **Score Tracking**: Real-time score display and final score on game over
- **Dual Controls**: Arrow keys or WASD for movement

### Bonus Features
- **Smooth Animation**: Consistent frame-rate based movement
- **Sound Effects**: Beep sounds for eating food and game over
- **Progressive Difficulty**: Speed increases every 50 points (5 food items)
- **Visual Polish**: 
  - Grid overlay for better spatial awareness
  - Distinct head and body colors
  - Food highlights for visual appeal
  - Clean game over screen

## Requirements

- Python 3.x
- Pygame library

## Installation

1. Install Pygame if you haven't already:
```bash
pip install pygame
```

2. Run the game:
```bash
python snake_game.py
```

## Controls

### During Gameplay
- **Arrow Keys** or **WASD**: Control snake direction
  - Up/W: Move up
  - Down/S: Move down
  - Left/A: Move left
  - Right/D: Move right
- **ESC** or **Q**: Quit game

### Game Over Screen
- **SPACE** or **ENTER**: Restart game
- **ESC** or **Q**: Quit game

## Gameplay Rules

1. The snake starts with a length of 3 segments
2. Guide the snake to eat the red food items
3. Each food item increases your score by 10 points
4. The snake grows longer with each food item eaten
5. Speed increases every 50 points to increase difficulty
6. Avoid hitting walls or your own body
7. Try to achieve the highest score possible!

## Game Statistics Display

- **Score**: Current score (top-left)
- **Length**: Current snake length (top-left)
- **Speed**: Current game speed (top-right)

## Code Structure

The game is organized into modular classes:

- **Snake**: Handles snake logic, movement, growth, and rendering
- **Food**: Manages food spawning and drawing
- **Game**: Main game loop, input handling, collision detection, and rendering

## Technical Details

- **Window Size**: 600x400 pixels
- **Grid Size**: 20x20 pixels per cell
- **Initial Speed**: 10 FPS
- **Maximum Speed**: 20 FPS
- **Starting Length**: 3 segments

## Tips for High Scores

1. Plan your path ahead to avoid trapping yourself
2. Use the edges and corners strategically
3. Keep your snake moving in large patterns when possible
4. As speed increases, focus on survival over aggressive food hunting
5. Practice makes perfect!

## Credits

Created as a classic implementation of the Snake game using only Pygame.
