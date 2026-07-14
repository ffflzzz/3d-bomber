export const BombSchema = { owner: 'eid', radius: 'u32', timer: 'f32', damage: 'f32', placed: 'u8' } as const
export const BombCapacitySchema = { max: 'u32', current: 'u32' } as const
export const BombPowerSchema = { radius: 'u32' } as const
