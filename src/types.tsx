export type GetUserId = {
  success: Boolean;
  userId: String | null;
};

export type SuccessMessage = {
  success: Boolean;
  error: String | null;
};

export type Update = {
  ts: String | null;
  val: number | null;
  type: String | null;
  d: Array<number> | null;
};

export type Device = {
  id: String | null;
  name: String | null;
  type: String;
};
