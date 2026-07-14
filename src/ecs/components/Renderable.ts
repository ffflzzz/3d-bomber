export const RenderableSchema = { meshId: 'u32', visible: 'u8' } as const
export const AnimationSchema = { current: 'u32', speed: 'f32', loop: 'u8' } as const
export const InteractableSchema = { type: 'u8', radius: 'f32', active: 'u8' } as const
