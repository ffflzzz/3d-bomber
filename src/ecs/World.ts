/**
 * ECS World definition for the bomber game.
 * 
 * The actual game logic currently runs in GameScene.tsx using direct state management.
 * This ECS layer provides the schema definitions and world factory for future migration
 * to a full ECS architecture.
 * 
 * bitECS v0.4.0 uses soa() to define component stores and query() to query them.
 */

import { createWorld, addEntity, type World } from 'bitecs'
import { soa } from 'bitecs'

export type GameWorld = World

export function createGameWorld(): GameWorld {
  return createWorld()
}
