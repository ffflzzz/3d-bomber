export const PlayerInputSchema = { moveX: 'f32', moveZ: 'f32', bomb: 'u8' } as const
export const AIStateSchema = { type: 'u8', target: 'eid', timer: 'f32', patrolX: 'f32', patrolZ: 'f32' } as const
export const CharacterControllerSchema = { grounded: 'u8', jumpForce: 'f32', moveSpeed: 'f32' } as const
