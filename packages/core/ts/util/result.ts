export type Ok<D> = {
  success: true;
  data: D;
};

export type Err<E> = {
  success: false;
  error: E;
};

export type Result<Data, Error> = Ok<Data> | Err<Error>;
