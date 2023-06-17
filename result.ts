export type Result<D, E extends Error = Error> =
    | { success: true; data: D }
    | { success: false; error: E };