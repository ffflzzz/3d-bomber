// Position/Velocity stored as simple soa components for bitECS v0.4
export interface PositionData { x: number; y: number; z: number }
export interface VelocityData { x: number; y: number; z: number }

export const PositionSchema = { x: 'f32', y: 'f32', z: 'f32' } as const
export const VelocitySchema = { x: 'f32', y: 'f32', z: 'f32' } as const
