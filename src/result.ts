export type Result<D, E = Error> =
    | { success: true; data: D }
    | { success: false; error: E };