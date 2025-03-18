export const generateRoomId = (id1: string, id2: string) => {
  return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
};
