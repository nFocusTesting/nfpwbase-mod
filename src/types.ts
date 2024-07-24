export type PayloadFile = {
  versions: string[];
  folders: string[];
  payloads: {
    [key: string]: FilePayload[];
  };
};

export type FilePayload = {
  filename: string;
  link: string;
  path: string;
  type: string;
  update: string;
  payload: string;
};
